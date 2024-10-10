const mongoose = require('mongoose');
const VendorProfile = require('../models/vendorProfileModel');

const vendorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Vendor name is required'],
        trim: true
      },
      profile: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorProfile' },
      email: {
        type: String,
        unique: true,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          'Please fill a valid email address'
        ]
      },
      phone: {
        type: String,
        unique: true,
        required: [true, 'Phone number is required'],
        match: [/^\d{10}$/, 'Phone number should be 10 digits']
      },
    profileImage: { type: String }, // Profile image URL stored in S3
    businessName: {
        type: String,
        required: [true, 'Business name is required'],
        trim: true
      },
    businessAddress: {
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
      country: { type: String, required: true }
    },
    businessHours: [{
        open: { type: String, default: '09:00 AM' },
        close: { type: String, default: '09:00 PM' }
      }],
    businessEmail: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true,
        match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, // Email validation
        required: true,
    }, // Business contact email
    businessPhone: { type: String }, // Business contact phone number
    gstNumber: { type: String, unique: true }, // GST number for verification
    panNumber: { type: String, unique: true, required: true }, // PAN number for verification
    bankDetails: {
      bankName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      ifscCode: { type: String, required: true }
    },
    businessDocuments: {
      gstCertificate: { type: String, required: true }, // GST certificate image URL stored in S3
      panCard: { type: String, required: true }, // PAN card image URL stored in S3
      bankStatement: { type: String, required: true }, // Bank statement image URL stored in S3
      addressProofImage: { type: String, required: true }
    },
    registrationStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }, // Status of vendor verification
    registrationComments: { type: String }, // Admin comments on registration status
    inventory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' }], // Reference to vendor's inventory
    orders: [{ type: mongoose.Schema.ObjectId, ref: 'Order' }], // List of all orders managed by the vendor
    wallet: { type: mongoose.Schema.ObjectId, ref: 'Wallet' }, // Wallet model for vendor’s earnings and balance
    ratings: {
      averageRating: { type: Number, min: 0, max: 5, default: 0 }, // Average rating of the vendor
      totalReviews: { type: Number, default: 0 } // Total number of reviews received
    },
    productsSold: { type: Number, default: 0 }, // Total number of products sold
    isActive: { type: Boolean, default: false }, // Vendor activity status (can only be active once approved)
    isAvailable: { type: String },
    unavailabilityReason: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
  const Vendor = mongoose.model('Vendor', vendorSchema);
  module.exports = Vendor;
  