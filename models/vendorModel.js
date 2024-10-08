const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const vendorSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Vendor's name
    email: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true,
        match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, // Email validation
        required: true,
    }, // Vendor's email for login
    phone: { type: String, unique: true }, // Contact number
    profileImage: { type: String }, // Profile image URL stored in S3
    businessName: { type: String, required: true }, // Name of the vendor's business
    businessAddress: {
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
      country: { type: String, required: true }
    },
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
    inventory: [{ type: Schema.Types.ObjectId, ref: 'Inventory' }], // Reference to vendor's inventory
    orders: [{ type: Schema.Types.ObjectId, ref: 'Order' }], // List of all orders managed by the vendor
    wallet: { type: Schema.Types.ObjectId, ref: 'Wallet' }, // Wallet model for vendor’s earnings and balance
    ratings: {
      averageRating: { type: Number, min: 0, max: 5, default: 0 }, // Average rating of the vendor
      totalReviews: { type: Number, default: 0 } // Total number of reviews received
    },
    productsSold: { type: Number, default: 0 }, // Total number of products sold
    communication: [{ type: Schema.Types.ObjectId, ref: 'Communication' }], // Reference to the communication model for messages with the admin
    isActive: { type: Boolean, default: false }, // Vendor activity status (can only be active once approved)
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
  module.exports = mongoose.model('Vendor', vendorSchema);
  