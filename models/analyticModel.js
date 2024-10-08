const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to the user for tracking individual activity
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }, // Reference to the vendor to track vendor-specific analytics
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Reference to the product for tracking product performance
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }, // Reference to the category for category-level analysis
  subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' }, // Reference to the subcategory for deeper breakdowns
  totalSiteVisits: { type: Number, default: 0 }, // Total visits to the platform
  uniqueVisitors: { type: Number, default: 0 }, // Unique visitors on the platform
  userEngagement: { 
    views: { type: Number, default: 0 }, // Number of times a product was viewed
    likes: { type: Number, default: 0 }, // Number of likes a product has received
    comments: { type: Number, default: 0 }, // Number of comments on a product or post
    shares: { type: Number, default: 0 }, // Number of times a product or content has been shared
    clicks: { type: Number, default: 0 }, // Number of clicks on a product or link
    bounceRate: { type: Number, default: 0 } // Percentage of visitors who left without interaction
  },
  cartAdditions: { type: Number, default: 0 }, // Number of times a product was added to carts
  cartAbandonmentRate: { type: Number, default: 0 }, // Percentage of carts abandoned without purchase
  purchases: { 
    totalPurchases: { type: Number, default: 0 }, // Total purchases made on the product
    purchaseValue: { type: Number, default: 0 } // Total value of purchases for a product or category
  },
  revenue: { 
    dailyRevenue: { type: Number, default: 0 }, // Revenue generated daily
    weeklyRevenue: { type: Number, default: 0 }, // Revenue generated weekly
    monthlyRevenue: { type: Number, default: 0 }, // Revenue generated monthly
    yearlyRevenue: { type: Number, default: 0 } // Revenue generated yearly
  },
  orderFulfillment: { 
    totalOrders: { type: Number, default: 0 }, // Total number of orders processed
    successfulDeliveries: { type: Number, default: 0 }, // Orders successfully delivered
    canceledOrders: { type: Number, default: 0 }, // Orders canceled by users or vendors
    returnedOrders: { type: Number, default: 0 } // Number of orders that were returned
  },
  topPerformingProducts: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Reference to top-selling products
    totalSales: { type: Number, default: 0 }, // Total sales for the product
    totalRevenue: { type: Number, default: 0 } // Total revenue for the product
  }],
  lowPerformingProducts: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Reference to low-performing products
    totalSales: { type: Number, default: 0 }, // Total sales for the product
    totalRevenue: { type: Number, default: 0 } // Total revenue for the product
  }],
  averageSessionDuration: { type: Number, default: 0 }, // Average time users spend on the site
  conversionRate: { type: Number, default: 0 }, // Percentage of visits that convert into purchases
  demographicData: {
    ageRange: { type: String }, // Age range of the users (e.g., 18-25, 26-35)
    gender: { type: String, enum: ['Male', 'Female', 'Other'] }, // Gender distribution
    location: { type: String } // Location-based analysis (City, State, Country)
  },
  trafficSources: {
    direct: { type: Number, default: 0 }, // Direct visits (type URL in the browser)
    organicSearch: { type: Number, default: 0 }, // Visits from search engines
    social: { type: Number, default: 0 }, // Visits from social media platforms
    referrals: { type: Number, default: 0 }, // Visits from other websites
    email: { type: Number, default: 0 } // Visits from email campaigns
  },
  userRetention: {
    dailyRetention: { type: Number, default: 0 }, // Percentage of users retained daily
    weeklyRetention: { type: Number, default: 0 }, // Percentage of users retained weekly
    monthlyRetention: { type: Number, default: 0 } // Percentage of users retained monthly
  },
  vendorPerformance: [{
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }, // Vendor reference
    productsListed: { type: Number, default: 0 }, // Number of products listed by the vendor
    productsSold: { type: Number, default: 0 }, // Number of products sold by the vendor
    totalEarnings: { type: Number, default: 0 }, // Total earnings of the vendor
    ratings: { type: Number, default: 0 } // Vendor’s average rating
  }],
  createdAt: { type: Date, default: Date.now }, // Creation date
  updatedAt: { type: Date, default: Date.now } // Update date
});

module.exports = mongoose.model('Analytics', analyticsSchema);
