const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const inventorySchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    currentStock: { type: Number, required: true },
    incomingStock: { type: Number, default: 0 },
    outgoingStock: { type: Number, default: 0 },
    warehouseLocation: {
      address: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: String },
      country: { type: String }
    },
    restockDate: { type: Date },
    lowStockThreshold: { type: Number, default: 10 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
  module.exports = mongoose.model('Inventory', inventorySchema);
  