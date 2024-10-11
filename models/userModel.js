const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const userSchema = new Schema({
    name: { type: String, required: true },
    email: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true,
        match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, // Email validation
        required: true,
    },
    phone: { type: String, unique: true },
    password: {
        type: String,
        required: true,
        select: false,
    },
    address: [{
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
      country: { type: String, required: true }
    }],
    wishlist: [{ type: Schema.Types.ObjectId, ref: 'Wishlist' }],
    cart: { type: Schema.Types.ObjectId, ref: 'Cart' },
    orders: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
    wallet: { type: Schema.Types.ObjectId, ref: 'Wallet' },
    paymentMethods: [{
      type: { type: String },
      details: { type: String }
    }],
    dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
//   preferences: {
//     notifications: {
//       email: { type: Boolean, default: true },
//       sms: { type: Boolean, default: true },
//       push: { type: Boolean, default: true }
//     },
//     newsletter: { type: Boolean, default: false },
//     language: { type: String, default: 'en' }
//   },
  socialProfiles: {
    facebook: { type: String },
    twitter: { type: String },
    instagram: { type: String }
  },
  recentlyViewed: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    viewedAt: { type: Date, default: Date.now }
  }],
//   deviceTokens: [{ type: String }], // For push notifications
//   referralCode: { type: String, unique: true },
//   referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
//   loyaltyPoints: { type: Number, default: 0 },
  accountStatus: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended', 'Deleted'],
    default: 'Active'
  },
  lastLoginDate: { type: Date },
  loginHistory: [{
    date: { type: Date },
    ipAddress: { type: String },
    deviceInfo: { type: String }
  }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  

  userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Hash password before saving user
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

  module.exports = mongoose.model('User', userSchema);
  