const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    timestamp: {
      type: String,
      default: () => new Date().toISOString()
    },
    userId: {
      type: String,
      default: 'system',
      index: true
    },
    userName: {
      type: String,
      default: 'System'
    },
    actionType: {
      type: String,
      default: 'ACTIVITY'
    },
    details: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      default: 'General'
    },
    status: {
      type: String,
      default: 'success'
    }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

module.exports = mongoose.model('Log', logSchema);
