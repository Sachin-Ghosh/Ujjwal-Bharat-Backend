const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
      product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true }
    }],
    totalAmount: { type: Number },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
  module.exports = mongoose.model('Cart', cartSchema);
  