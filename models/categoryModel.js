const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    name: { type: String, unique: true, required: true },
    description: { type: String },
    image: { type: String },
    subcategories: [{ type: Schema.Types.ObjectId, ref: 'SubCategory' }]
  });
  
  const subcategorySchema = new Schema({
    name: { type: String, unique: true, required: true },
    description: { type: String },
    image: { type: String },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true }
  });
  
  module.exports = {
    Category: mongoose.model('Category', categorySchema),
    SubCategory: mongoose.model('SubCategory', subcategorySchema)
  };
  