const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const vendorInventoryRequestSchema = new Schema({
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    requestDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    comment: { type: String }
  });
  
  module.exports = mongoose.model('VendorInventoryRequest', vendorInventoryRequestSchema);
  