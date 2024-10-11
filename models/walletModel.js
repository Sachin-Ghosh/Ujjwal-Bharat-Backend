const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const walletSchema = new Schema({
    owner: { type: Schema.Types.ObjectId, refPath: 'ownerModel', required: true },  // Owner of the wallet (User or Vendor)
    ownerModel: { type: String, enum: ['User', 'Vendor'], required: true },  // Discriminator for User or Vendor model
    balance: { type: Number, default: 0 },
    transactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
      }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
  module.exports = mongoose.model('Wallet', walletSchema);
  