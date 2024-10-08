const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  name: { type: String, required: true },
  sku: { type: String, unique: true },  // Stock Keeping Unit
  vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  description: { type: String, required: true },
  images: [{ type: String }],  // Array of image URLs stored in S3
  category: { type: Schema.Types.ObjectId, ref: 'Category' },
  subcategory: { type: Schema.Types.ObjectId, ref: 'SubCategory' },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  stock: { type: Number, required: true },
  warranty: { type: String },
  tags: [{ type: String }],  // Tags for search functionality
  status: { type: String, enum: ['Active', 'Inactive', 'Out of Stock'], default: 'Active' },
  rating: { type: Number, default: 0 },
  reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
