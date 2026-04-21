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
  isUsed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('QRCoupon', qrCouponSchema);
