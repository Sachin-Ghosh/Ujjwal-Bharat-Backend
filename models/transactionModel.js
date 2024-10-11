const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['CREDIT', 'DEBIT'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: String,
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING'
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }
  }, { timestamps: true });


  const Transaction = mongoose.model('Transaction', transactionSchema);
  module.exports = Transaction;
  