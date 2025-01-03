const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    orderNumber: { type: String, unique: true, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    products: [{
      product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }
    }],
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Refunded', 'FAILED'], default: 'Pending' },
    shippingAddress: {
        addressLine1: { type: String, required: true },
        addressLine2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
      country: { type: String, required: true }
    },
    paymentMethod: {
        type: String,
        enum: ['WALLET', 'COD'],
        required: true
      },
      cancellationRequested: {
        type: Boolean,
        default: false
      },
      cancellationReason: { type: String },
    deliveryStatus: { type: String, enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'], default: 'Processing' },
    shippingMethod: { type: String },
    orderDate: { type: Date, default: Date.now },
    deliveryDate: { type: Date },
    comments: [{ user: { type: Schema.Types.ObjectId, ref: 'User' }, message: { type: String }, date: { type: Date } }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
  module.exports = mongoose.model('Order', orderSchema);
  