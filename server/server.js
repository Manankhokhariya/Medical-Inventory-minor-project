require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = process.env.SERVER_PORT || 5000;

app.use(cors());
app.use(express.json());

async function getActor(req) {
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return { id: 'anon', role: 'guest', name: 'Anonymous' };
  }
  const user = await db.getUserById(userId);
  if (!user) {
    return { id: 'anon', role: 'guest', name: 'Anonymous' };
  }
  return user;
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Medical Inventory Node.js API',
    database: db.isConnected() ? 'connected' : 'disconnected',
    databaseType: 'MongoDB',
    time: new Date()
  });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, organization } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const safeUser = await db.createUser({
      name: String(name).trim(),
      email: cleanEmail,
      password: String(password),
      role: role === 'admin' ? 'admin' : 'user',
      phone: phone ? String(phone).trim() : '',
      organization: organization ? String(organization).trim() : ''
    });

    res.status(201).json({ message: 'User registered successfully', user: safeUser });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await db.getUserWithPassword(cleanEmail);
    if (!user || user.password !== String(password)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const { password: _, ...safeUser } = user;

    await db.addLog({
      userId: safeUser.id,
      userName: safeUser.name,
      actionType: 'LOGIN',
      details: `${safeUser.name} signed in successfully (${safeUser.role.toUpperCase()} session).`,
      category: 'Security'
    });

    res.json({ message: 'Login successful', user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const actor = await getActor(req);
    if (actor.id === 'anon') {
      return res.status(401).json({ error: 'Your account has been deleted or session is invalid.' });
    }
    res.json({ user: actor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inventory', async (req, res) => {
  try {
    const actor = await getActor(req);
    if (actor.id === 'anon') {
      return res.status(401).json({ error: 'Authentication required. Your account may have been removed.' });
    }
    const { userId } = req.query;

    if (actor.role === 'admin') {
      if (userId) {
        return res.json(await db.getInventory(userId));
      }
      return res.json(await db.getInventory());
    }

    return res.json(await db.getInventory(actor.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/inventory', async (req, res) => {
  try {
    const actor = await getActor(req);
    if (actor.id === 'anon') {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, stock, reorderLevel, category, expiryDate, manufacturer, targetUserId } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Medicine name is required.' });
    }

    if (actor.role === 'admin') {
      if (!targetUserId || targetUserId === actor.id) {
        return res.status(400).json({
          error: 'Administrator accounts cannot store personal medicine records. Please select a clinic user account.'
        });
      }
      const targetUser = await db.getUserById(targetUserId);
      if (!targetUser || targetUser.role === 'admin') {
        return res.status(400).json({
          error: 'Medicines can only be assigned to clinic user accounts, not administrative accounts.'
        });
      }
    }

    const assignedUserId = (actor.role === 'admin' && targetUserId) ? targetUserId : actor.id;

    const newItem = await db.createInventoryItem({
      userId: assignedUserId,
      name,
      stock,
      reorderLevel,
      category,
      expiryDate,
      manufacturer
    }, actor);

    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/inventory/:id', async (req, res) => {
  try {
    const actor = await getActor(req);
    if (actor.id === 'anon') {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const item = await db.getInventoryItem(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    if (actor.role !== 'admin' && item.userId !== actor.id) {
      return res.status(403).json({ error: 'You do not have permission to edit this record.' });
    }

    const updated = await db.updateInventoryItem(req.params.id, req.body, actor);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/inventory/:id', async (req, res) => {
  try {
    const actor = await getActor(req);
    if (actor.id === 'anon') {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const item = await db.getInventoryItem(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    if (actor.role !== 'admin' && item.userId !== actor.id) {
      return res.status(403).json({ error: 'You do not have permission to delete this record.' });
    }

    await db.deleteInventoryItem(req.params.id, actor);
    res.json({ message: 'Medicine deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const actor = await getActor(req);
    if (actor.role !== 'admin') {
      return res.status(403).json({ error: 'Administrator access required.' });
    }

    const users = await db.getUsers();
    const inventory = await db.getInventory();
    const enrichedUsers = users.map(u => ({
      ...u,
      itemCount: inventory.filter(i => i.userId === u.id).length
    }));

    res.json(enrichedUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const actor = await getActor(req);
    if (actor.role !== 'admin') {
      return res.status(403).json({ error: 'Administrator access required.' });
    }

    const updatedUser = await db.updateUser(req.params.id, req.body);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    await db.addLog({
      userId: actor.id,
      userName: actor.name,
      actionType: 'UPDATE_USER',
      details: `Admin updated user record for ${updatedUser.name} (${updatedUser.email}). Changes: ${Object.keys(req.body).join(', ')}`,
      category: 'Administration'
    });

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const actor = await getActor(req);
    if (actor.role !== 'admin') {
      return res.status(403).json({ error: 'Administrator access required.' });
    }

    if (actor.id === req.params.id) {
      return res.status(400).json({ error: 'Cannot delete your own admin account.' });
    }

    const user = await db.getUserById(req.params.id);
    const success = await db.deleteUser(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }

    await db.addLog({
      userId: actor.id,
      userName: actor.name,
      actionType: 'DELETE_USER',
      details: `Admin deleted user account: ${user ? user.name : req.params.id}`,
      category: 'Administration'
    });

    res.json({ message: 'User and their inventory deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/logs', async (req, res) => {
  try {
    const actor = await getActor(req);
    if (actor.id === 'anon') {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (actor.role === 'admin') {
      return res.json(await db.getLogs());
    }
    return res.json(await db.getLogs(actor.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/logs/:id', async (req, res) => {
  try {
    const actor = await getActor(req);
    if (actor.role !== 'admin') {
      return res.status(403).json({ error: 'Administrator access required.' });
    }

    const updated = await db.updateLog(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Log entry not found' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/logs/:id', async (req, res) => {
  try {
    const actor = await getActor(req);
    if (actor.role !== 'admin') {
      return res.status(403).json({ error: 'Administrator access required.' });
    }

    const success = await db.deleteLog(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Log entry not found' });
    }

    res.json({ message: 'Log entry removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  try {
    await db.connect();
    app.listen(PORT, () => {
      console.log(`Medical Inventory Node.js API server running on port ${PORT}`);
      console.log(`MongoDB Connected: ${db.isConnected() ? 'Yes' : 'No'}`);
    });
  } catch (err) {
    console.error('Failed to initialize server with MongoDB:', err.message);
    process.exit(1);
  }
}

startServer();
