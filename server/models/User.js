const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user'
    },
    status: {
      type: String,
      default: 'active'
    },
    phone: {
      type: String,
      default: ''
    },
    organization: {
      type: String,
      default: 'Independent Pharmacy'
    },
    createdAt: {
      type: String,
      default: () => new Date().toISOString()
    }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

module.exports = mongoose.model('User', userSchema);
