const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const couponSchema = new Schema({
    code: { type: String, unique: true, required: true },
    description: { type: String },
    discountPercentage: { type: Number, required: true },
    maxDiscountAmount: { type: Number },
    expirationDate: { type: Date, required: true },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  });
  
  module.exports = mongoose.model('Coupon', couponSchema);
  