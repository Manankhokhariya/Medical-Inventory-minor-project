const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      default: 'General'
    },
    stock: {
      type: Number,
      default: 0
    },
    reorderLevel: {
      type: Number,
      default: 10
    },
    expiryDate: {
      type: String,
      default: '2027-12-31'
    },
    manufacturer: {
      type: String,
      default: 'General Pharmaceutical'
    },
    status: {
      type: String,
      default: 'In Stock'
    },
    updatedAt: {
      type: String,
      default: () => new Date().toISOString()
    }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

module.exports = mongoose.model('Inventory', inventorySchema);
