const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create a schema for Price History
const PriceHistorySchema = new Schema({
    price: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    }
  });
  
  // Create a schema for Product Attributes
  const AttributeSchema = new Schema({
    key: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    }
  });

const productSchema = new Schema({
  name: { type: String, required: true },
  sku: { type: String, unique: true },  // Stock Keeping Unit
  vendor: { type:  mongoose.Schema.ObjectId, ref: 'Vendor', required: true },
  description: { type: String, required: true },
  images: [{ type: String }],  // Array of image URLs stored in S3
  priceHistory: {
    type: [PriceHistorySchema],
    default: [],
  },
  category: { type:  mongoose.Schema.ObjectId, ref: 'Category' },
  subcategory: { type:  mongoose.Schema.ObjectId, ref: 'SubCategory' },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  stock: {
    type: Number,
    required: [true, 'Product stock is required'],
    min: 0,
  },
  warranty: { type: String },
  tags: [{ type: String }],  // Tags for search functionality
  status: { type: String, enum: ['Active', 'Inactive', 'Out of Stock'], default: 'Active' },
  rating: { type: Number, default: 0 },
  ratingCount: {
    type: Number,
    default: 0,
  },
  reviews: [{ type:  mongoose.Schema.ObjectId, ref: 'Review' }],
  attributes: [AttributeSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
},
{
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });


  // Virtual populate for reviews
productSchema.virtual('reviewAnalytics', {
    ref: 'Review',
    foreignField: 'product',
    localField: '_id',
    count: true,
  });
  
  // Middleware to update timestamps
  productSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
  });

module.exports = mongoose.model('Product', productSchema);
