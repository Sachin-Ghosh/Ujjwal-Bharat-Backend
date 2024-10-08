const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },  // Links the payment to a specific order
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  vendor: { type: Schema.Types.ObjectId, ref: 'Vendor' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' }, // Default currency as Indian Rupees
  paymentMethod: { type: String, enum: ['Credit Card', 'Debit Card', 'Net Banking', 'UPI', 'Wallet'], required: true },
  paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
  razorpayPaymentId: { type: String },  // Razorpay payment reference ID
  transactionDate: { type: Date, default: Date.now },
  remarks: { type: String }  // Any remarks or notes for the transaction
});

module.exports = mongoose.model('Payment', paymentSchema);
