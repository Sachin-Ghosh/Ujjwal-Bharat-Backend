// models/vendorProfile.js
const mongoose = require('mongoose');

const vendorProfileSchema = new mongoose.Schema({
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    businessWebsite: { type: String },
    businessEmail: { type: String },
    yearEstablished: { type: Number },
    businessDescription: { type: String }, 
    socialLinks: {
      linkedin: { type: String },
      facebook: { type: String },
      instagram: { type: String },
      twitter: { type: String }
    },
    testimonials: [{
      customerName: { type: String },
      review: { type: String },
      rating: { type: Number, min: 1, max: 5 }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
  const VendorProfile = mongoose.model('VendorProfile', vendorProfileSchema);
module.exports = VendorProfile;
  