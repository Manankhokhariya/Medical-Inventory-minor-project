const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { User, Inventory, Log } = require('./models');

const DB_FILE = path.join(__dirname, 'data', 'db.json');

function cleanDoc(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj._id;
  delete obj.__v;
  return obj;
}

function cleanDocs(docs) {
  return docs.map(cleanDoc);
}

class Database {
  constructor() {
    this._connectionPromise = null;
  }

  async connect(uri) {
    if (this._connectionPromise) {
      return this._connectionPromise;
    }

    const mongoUri =
      uri ||
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      'mongodb://127.0.0.1:27017/medical_inventory';

    this._connectionPromise = mongoose
      .connect(mongoUri)
      .then(async (m) => {
        console.log(`Connected to MongoDB successfully at ${mongoUri}`);
        await this._seedIfEmpty();
        return m;
      })
      .catch((err) => {
        console.error(`MongoDB connection error (${mongoUri}):`, err.message);
        this._connectionPromise = null;
        throw err;
      });

    return this._connectionPromise;
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }

  async _seedIfEmpty() {
    try {
      const userCount = await User.countDocuments();
      if (userCount > 0) {
        return;
      }

      console.log('MongoDB collection is empty. Checking for initial data to seed...');
      let seedData = null;

      if (fs.existsSync(DB_FILE)) {
        try {
          const raw = fs.readFileSync(DB_FILE, 'utf8');
          seedData = JSON.parse(raw);
        } catch (e) {
          console.warn('Failed to parse existing db.json for seeding, using defaults:', e.message);
        }
      }

      if (!seedData || !Array.isArray(seedData.users) || seedData.users.length === 0) {
        seedData = { users: [], inventory: [], logs: [] };
      }

      if (seedData.users && seedData.users.length > 0) {
        await User.insertMany(seedData.users);
        console.log(`Seeded ${seedData.users.length} users into MongoDB.`);
      }

      if (seedData.inventory && seedData.inventory.length > 0) {
        await Inventory.insertMany(seedData.inventory);
        console.log(`Seeded ${seedData.inventory.length} inventory items into MongoDB.`);
      }

      if (seedData.logs && seedData.logs.length > 0) {
        await Log.insertMany(seedData.logs);
        console.log(`Seeded ${seedData.logs.length} logs into MongoDB.`);
      }
    } catch (err) {
      console.error('Error during initial database seeding:', err.message);
    }
  }

  async getUsers() {
    const users = await User.find({}).lean();
    return users.map(({ password, _id, __v, ...u }) => u);
  }

  async getUserWithPassword(email) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).lean();
    return cleanDoc(user);
  }

  async getUserById(id) {
    const user = await User.findOne({ id }).lean();
    if (!user) return null;
    const { password, ...safeUser } = cleanDoc(user);
    return safeUser;
  }

  async createUser(userData) {
    const cleanEmail = String(userData.email || '').trim().toLowerCase();
    const exists = await User.findOne({ email: cleanEmail }).lean();
    if (exists) {
      throw new Error('An account with this email address already exists.');
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      name: String(userData.name || '').trim(),
      email: cleanEmail,
      password: String(userData.password),
      role: userData.role === 'admin' ? 'admin' : 'user',
      status: 'active',
      phone: userData.phone ? String(userData.phone).trim() : '',
      organization: userData.organization ? String(userData.organization).trim() : 'Independent Pharmacy',
      createdAt: new Date().toISOString()
    };

    const created = await User.create(newUser);

    await this.addLog({
      userId: newUser.id,
      userName: newUser.name,
      actionType: 'REGISTER',
      details: `New account registered: ${newUser.name} (${newUser.email}) with role [${newUser.role}]`,
      category: 'Security'
    });

    const { password, ...safeUser } = cleanDoc(created);
    return safeUser;
  }

  async updateUser(id, updates) {
    const updateData = { ...updates };
    if (updateData.email) {
      updateData.email = String(updateData.email).trim().toLowerCase();
    }
    const updated = await User.findOneAndUpdate({ id }, { $set: updateData }, { new: true }).lean();
    if (!updated) return null;
    const { password, ...safeUser } = cleanDoc(updated);
    return safeUser;
  }

  async deleteUser(id) {
    const res = await User.deleteOne({ id });
    if (res.deletedCount === 0) return false;
    await Inventory.deleteMany({ userId: id });
    return true;
  }

  async getInventory(userId = null) {
    const query = userId ? { userId } : {};
    const items = await Inventory.find(query).sort({ updatedAt: -1 }).lean();
    return cleanDocs(items);
  }

  async getInventoryItem(id) {
    const item = await Inventory.findOne({ id }).lean();
    return cleanDoc(item);
  }

  async createInventoryItem(itemData, actor) {
    const stock = Number(itemData.stock) || 0;
    const reorderLevel = Number(itemData.reorderLevel) || 10;

    let status = 'In Stock';
    if (stock === 0) status = 'Out of Stock';
    else if (stock <= reorderLevel) status = 'Low Stock';

    const targetUserId = itemData.userId || actor.id;
    const targetUser = await this.getUserById(targetUserId);
    if (targetUser && targetUser.role === 'admin') {
      throw new Error('Administrative accounts cannot hold medicine records. Medicines must belong to a clinic user account.');
    }

    const newItem = {
      id: 'med_' + Date.now(),
      userId: targetUserId,
      name: itemData.name,
      category: itemData.category || 'General',
      stock: stock,
      reorderLevel: reorderLevel,
      expiryDate: itemData.expiryDate || '2027-12-31',
      manufacturer: itemData.manufacturer || 'General Pharmaceutical',
      status: status,
      updatedAt: new Date().toISOString()
    };

    const created = await Inventory.create(newItem);

    await this.addLog({
      userId: actor.id,
      userName: actor.name,
      actionType: 'CREATE_MEDICINE',
      details: `Added new medicine to catalog: ${newItem.name} (${newItem.stock} units)`,
      category: 'Catalog'
    });

    return cleanDoc(created);
  }

  async updateInventoryItem(id, updates, actor) {
    const current = await Inventory.findOne({ id }).lean();
    if (!current) return null;

    if (updates.userId) {
      const owner = await this.getUserById(updates.userId);
      if (owner && owner.role === 'admin') {
        throw new Error('Administrative accounts cannot hold medicine records.');
      }
    }

    const newStock = updates.stock !== undefined ? Number(updates.stock) : current.stock;
    const newReorder = updates.reorderLevel !== undefined ? Number(updates.reorderLevel) : current.reorderLevel;

    let status = 'In Stock';
    if (newStock === 0) status = 'Out of Stock';
    else if (newStock <= newReorder) status = 'Low Stock';

    const updateData = {
      ...updates,
      stock: newStock,
      reorderLevel: newReorder,
      status: status,
      updatedAt: new Date().toISOString()
    };

    const updated = await Inventory.findOneAndUpdate({ id }, { $set: updateData }, { new: true }).lean();

    await this.addLog({
      userId: actor.id,
      userName: actor.name,
      actionType: 'UPDATE_MEDICINE',
      details: `Updated catalog record for ${updated.name} (Stock: ${updated.stock} units)`,
      category: 'Catalog'
    });

    return cleanDoc(updated);
  }

  async deleteInventoryItem(id, actor) {
    const item = await Inventory.findOne({ id }).lean();
    if (!item) return false;

    await Inventory.deleteOne({ id });

    await this.addLog({
      userId: actor.id,
      userName: actor.name,
      actionType: 'DELETE_MEDICINE',
      details: `Deleted medicine record: ${item.name}`,
      category: 'Catalog'
    });

    return true;
  }

  async getLogs(userId = null) {
    const query = userId ? { userId } : {};
    const logs = await Log.find(query).sort({ timestamp: -1 }).limit(200).lean();
    return cleanDocs(logs);
  }

  async addLog(logData) {
    const newLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      userId: logData.userId || 'system',
      userName: logData.userName || 'System',
      actionType: logData.actionType || 'ACTIVITY',
      details: logData.details || '',
      category: logData.category || 'General',
      status: logData.status || 'success'
    };

    const created = await Log.create(newLog);
    return cleanDoc(created);
  }

  async updateLog(id, updates) {
    const updated = await Log.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
    return cleanDoc(updated);
  }

  async deleteLog(id) {
    const res = await Log.deleteOne({ id });
    return res.deletedCount > 0;
  }
}

const databaseInstance = new Database();
module.exports = databaseInstance;
