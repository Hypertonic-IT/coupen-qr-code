const mongoose = require('mongoose');

const qrCouponSchema = new mongoose.Schema({
  uniqueCode: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: Number,
    required: true
  },
  batchId: {
    type: String,
    index: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  isDownloaded: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'cancelled'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('QRCoupon', qrCouponSchema);
