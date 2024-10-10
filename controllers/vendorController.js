const Vendor = require('../models/vendorModel');
const VendorProfile = require('../models/vendorProfileModel');
const VendorInventoryRequest = require('../models/vendorInventoryRequestModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Inventory = require('../models/inventoryModel');
const Wallet = require('../models/walletModel');

// Register Vendor
exports.registerVendor = async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        businessName,
        businessAddress,
        businessEmail,
        businessPhone,
        gstNumber,
        panNumber,
        bankDetails,
      } = req.body;
  
      // Check if vendor already exists
      const existingVendor = await Vendor.findOne({ 
        $or: [
          { email },
          { phone },
          { businessEmail },
          { gstNumber },
          { panNumber }
        ]
      });
  
      if (existingVendor) {
        return res.status(400).json({
          status: 'fail',
          message: 'Vendor already exists with one or more of these details'
        });
      }
  
      // Create new vendor
      const vendor = new Vendor(req.body);
      await vendor.save();
  
      // Create wallet for vendor
      const wallet = new Wallet({
        owner: vendor._id,
        ownerModel: 'Vendor'
      });
      await wallet.save();
  
      // Update vendor with wallet reference
      vendor.wallet = wallet._id;
      await vendor.save();
  
      res.status(201).json({
        status: 'success',
        data: vendor
      });
    } catch (error) {
      res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };

// Get all vendors with filtering and sorting
exports.getAllVendors = async (req, res) => {
  try {
    // 1) Filtering
    const queryObj = { ...req.query };
    const excludedFields = ['sort', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    let query = Vendor.find(JSON.parse(queryStr));

    // 2) Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // 3) Field limiting
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select('-__v');
    }

    // Execute query
    const vendors = await query;

    res.status(200).json({
      status: 'success',
      results: vendors.length,
      data: vendors
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Get vendor by ID
exports.getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id).populate('profile');
    
    //   .populate('inventory')
    //   .populate('orders')
    //   .populate('wallet')
    //   .populate('communication');

    if (!vendor) {
      return res.status(404).json({ 
        status: 'fail',
        message: 'No vendor found with that ID'
      });
    }


    console.log('Vendor profile:', vendor.profile);
    res.status(200).json({
      status: 'success',
      data: vendor,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Get Vendor Profile by Vendor ID
exports.getVendorProfileByVendorId = async (req, res) => {
    try {
      const vendorId = req.params.vendorId;
  
      // Find the VendorProfile directly using the vendor field
      const profile = await VendorProfile.findOne({ vendor: vendorId });
  
      if (!profile) {
        return res.status(404).json({
          status: 'fail',
          message: 'No profile found for this vendor'
        });
      }
  
      res.status(200).json({
        status: 'success',
        data: profile
      });
    } catch (error) {
      res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };
// Create/Update Vendor Profile
exports.updateVendorProfile = async (req, res) => {
    try {
      const vendorId = req.params.id;
      const profileData = req.body;
  
      let vendorProfile = await VendorProfile.findOne({ vendor: vendorId });
      
      if (vendorProfile) {
        vendorProfile = await VendorProfile.findOneAndUpdate(
          { vendor: vendorId },
          profileData,
          { new: true, runValidators: true }
        );
      } else {
        vendorProfile = await VendorProfile.create({
          vendor: vendorId,
          ...profileData
        });
      }
  
      res.status(200).json({
        status: 'success',
        data: vendorProfile
      });
    } catch (error) {
      res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };

// Update vendor
exports.updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!vendor) {
      return res.status(404).json({
        status: 'fail',
        message: 'No vendor found with that ID'
      });
    }

    res.status(200).json({
      status: 'success',
      data: vendor
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Delete vendor
exports.deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        status: 'fail',
        message: 'No vendor found with that ID'
      });
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Create Inventory Request
exports.createInventoryRequest = async (req, res) => {
    try {
      const { productId } = req.body;
      const vendorId = req.params.id;
  
      const inventoryRequest = await VendorInventoryRequest.create({
        vendor: vendorId,
        product: productId
      });
  
      res.status(201).json({
        status: 'success',
        data: inventoryRequest
      });
    } catch (error) {
      res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };
  
  // Update Vendor Business Documents
  exports.updateBusinessDocuments = async (req, res) => {
    try {
      const vendorId = req.params.id;
      const { gstCertificate, panCard, bankStatement, addressProofImage } = req.body;
  
      const vendor = await Vendor.findByIdAndUpdate(
        vendorId,
        {
          businessDocuments: {
            gstCertificate,
            panCard,
            bankStatement,
            addressProofImage
          }
        },
        { new: true, runValidators: true }
      );
  
      if (!vendor) {
        return res.status(404).json({
          status: 'fail',
          message: 'No vendor found with that ID'
        });
      }
  
      res.status(200).json({
        status: 'success',
        data: vendor
      });
    } catch (error) {
      res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };

// Get vendor statistics
exports.getVendorStats = async (req, res) => {
  try {
    const stats = await Vendor.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: null,
          numVendors: { $sum: 1 },
          avgRating: { $avg: '$ratings.averageRating' },
          totalProductsSold: { $sum: '$productsSold' },
          numPendingVendors: {
            $sum: { $cond: [{ $eq: ['$registrationStatus', 'Pending'] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Update vendor registration status
exports.updateRegistrationStatus = async (req, res) => {
  try {
    const { status, comments } = req.body;
    
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { 
        registrationStatus: status,
        registrationComments: comments,
        isActive: status === 'Approved'
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!vendor) {
      return res.status(404).json({
        status: 'fail',
        message: 'No vendor found with that ID'
      });
    }

    res.status(200).json({
      status: 'success',
      data: vendor
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Get top performing vendors
exports.getTopVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({ isActive: true })
      .sort('-productsSold -ratings.averageRating')
      .select('name businessName ratings productsSold');

    res.status(200).json({
      status: 'success',
      results: vendors.length,
      data: vendors
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Update vendor ratings
exports.updateVendorRatings = async (req, res) => {
    try {
      const vendor = await Vendor.findById(req.params.id);
      
      if (!vendor) {
        return res.status(404).json({
          status: 'fail',
          message: 'No vendor found with that ID'
        });
      }
  
      const { rating } = req.body;
  
      // Ensure the rating is a valid number
      if (typeof rating !== 'number' || rating < 0 || rating > 5) {
        return res.status(400).json({
          status: 'fail',
          message: 'Rating must be a number between 0 and 5'
        });
      }
  
      // Initialize totalReviews and averageRating if they don't exist
      if (vendor.ratings.totalReviews === undefined) {
        vendor.ratings.totalReviews = 0;
        vendor.ratings.averageRating = 0;
      }
  
      vendor.ratings.totalReviews += 1;
  
      // Calculate the new average rating
      vendor.ratings.averageRating = 
        ((vendor.ratings.averageRating * (vendor.ratings.totalReviews - 1)) + rating) / 
        vendor.ratings.totalReviews;
  
      // Ensure averageRating stays within bounds
      vendor.ratings.averageRating = Math.min(Math.max(vendor.ratings.averageRating, 0), 5);
  
      await vendor.save();
  
      res.status(200).json({
        status: 'success',
        data: vendor
      });
    } catch (error) {
      res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };
  

// Get vendor revenue analytics
exports.getVendorRevenue = async (req, res) => {
    try {
      const vendorId = req.params.id;
      const { startDate, endDate } = req.query;
  
      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
  
      const revenueData = await Order.aggregate([
        {
          $match: {
            vendor: vendorId,
            ...dateFilter
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            dailyRevenue: { $sum: "$totalAmount" },
            ordersCount: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
  
      res.status(200).json({
        status: 'success',
        data: revenueData
      });
    } catch (error) {
      res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };
  
  // Get vendor inventory summary
  exports.getInventorySummary = async (req, res) => {
    try {
      const vendorId = req.params.id;
      
      const inventorySummary = await Product.aggregate([
        { $match: { vendor: vendorId } },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalStock: { $sum: "$stock" },
            averagePrice: { $avg: "$price" },
            lowStockProducts: {
              $sum: {
                $cond: [{ $lt: ["$stock", 10] }, 1, 0]
              }
            }
          }
        }
      ]);
  
      res.status(200).json({
        status: 'success',
        data: inventorySummary[0] || {}
      });
    } catch (error) {
      res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };
  
  // Update vendor business hours
  exports.updateBusinessHours = async (req, res) => {
    try {
      const vendorId = req.params.id;
      const { businessHours } = req.body;
  
      const vendor = await Vendor.findByIdAndUpdate(
        vendorId,
        { $set: { businessHours } },
        { new: true }
      );
  
      if (!vendor) {
        return res.status(404).json({
          status: 'fail',
          message: 'No vendor found with that ID'
        });
      }
  
      res.status(200).json({
        status: 'success',
        data: vendor
      });
    } catch (error) {
      res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };
  
  // Get vendor performance metrics
  exports.getPerformanceMetrics = async (req, res) => {
    try {
      const vendorId = req.params.id;
  
      const orders = await Order.find({ vendor: vendorId });
      
      const metrics = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
        averageOrderValue: orders.length > 0 
          ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length 
          : 0
      };
  
      res.status(200).json({
        status: 'success',
        data: metrics
      });
    } catch (error) {
      res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };
  
  // Update vendor availability status
exports.updateAvailabilityStatus = async (req, res) => {
    try {
      const vendorId = req.params.id;
      const { isAvailable, unavailabilityReason } = req.body;
  
      // Check if the vendor exists
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return res.status(404).json({
          status: 'fail',
          message: 'No vendor found with that ID'
        });
      }
  
      // Update the vendor's availability status and unavailability reason
      vendor.isAvailable = isAvailable;
      vendor.unavailabilityReason = isAvailable ? null : unavailabilityReason;
  
      // Save the updated vendor document
      await vendor.save();
  
      res.status(200).json({
        status: 'success',
        data: vendor
      });
    } catch (error) {
      res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };
  
  
  // Get vendor customer feedback
  exports.getCustomerFeedback = async (req, res) => {
    try {
      const vendorId = req.params.id;
      
      const feedback = await Order.aggregate([
        { $match: { vendor: vendorId } },
        { $unwind: "$reviews" },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$reviews.rating" },
            totalReviews: { $sum: 1 },
            reviews: { 
              $push: {
                rating: "$reviews.rating",
                comment: "$reviews.comment",
                date: "$reviews.createdAt"
              }
            }
          }
        }
      ]);
  
      res.status(200).json({
        status: 'success',
        data: feedback[0] || { averageRating: 0, totalReviews: 0, reviews: [] }
      });
    } catch (error) {
      res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };
  
//   // Update vendor delivery areas
//   exports.updateDeliveryAreas = async (req, res) => {
//     try {
//       const vendorId = req.params.id;
//       const { deliveryAreas } = req.body;
  
//       const vendor = await Vendor.findByIdAndUpdate(
//         vendorId,
//         { $set: { deliveryAreas } },
//         { new: true }
//       );
  
//       if (!vendor) {
//         return res.status(404).json({
//           status: 'fail',
//           message: 'No vendor found with that ID'
//         });
//       }
  
//       res.status(200).json({
//         status: 'success',
//         data: vendor
//       });
//     } catch (error) {
//       res.status(400).json({
//         status: 'fail',
//         message: error.message
//       });
//     }
//   };
  
  // Get vendor's best-selling products
  exports.getBestSellingProducts = async (req, res) => {
    try {
      const vendorId = req.params.id;
      
      const bestSellers = await Order.aggregate([
        { $match: { vendor: vendorId } },
        { $unwind: "$products" },
        {
          $group: {
            _id: "$products.product",
            totalSold: { $sum: "$products.quantity" },
            revenue: { $sum: { $multiply: ["$products.price", "$products.quantity"] } }
          }
        },
        { $sort: { totalSold: -1 } },
        { $limit: 10 }
      ]);
  
      // Populate product details
      const populatedBestSellers = await Product.populate(bestSellers, {
        path: '_id',
        select: 'name description price'
      });
  
      res.status(200).json({
        status: 'success',
        data: populatedBestSellers
      });
    } catch (error) {
      res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };

  // View Vendor Orders
exports.viewOrders = async (req, res) => {
    try {
        const vendorId = req.params.id;
      const orders = await Order.find({ vendor: vendorId });
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  // Manage Inventory
  exports.manageInventory = async (req, res) => {
    const { productId, currentStock, incomingStock } = req.body;
  
    try {
      const product = await Product.findOne({ _id: productId, vendor: req.vendor._id });
      if (!product) return res.status(404).json({ message: 'Product not found' });
  
      product.currentStock = currentStock;
      product.incomingStock = incomingStock;
      await product.save();
  
      res.json({ message: 'Inventory updated successfully', product });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Get Vendor Analytics
exports.getVendorAnalytics = async (req, res) => {
    try {
      const vendorId = req.params.id;
  
      const analytics = await Order.aggregate([
        { $match: { vendor: vendorId } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$totalAmount" },
            averageOrderValue: { $avg: "$totalAmount" }
          }
        }
      ]);
  
      const inventory = await Inventory.aggregate([
        { $match: { vendor: vendorId } },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalStock: { $sum: "$currentStock" },
            lowStockItems: {
              $sum: {
                $cond: [
                  { $lt: ["$currentStock", "$lowStockThreshold"] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]);
  
      res.status(200).json({
        status: 'success',
        data: {
          orders: analytics[0] || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 },
          inventory: inventory[0] || { totalProducts: 0, totalStock: 0, lowStockItems: 0 }
        }
      });
    } catch (error) {
      res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };
  
  // Get Wallet Transactions
  exports.getWalletTransactions = async (req, res) => {
    try {
      const vendorId = req.params.id;
      
      const wallet = await Wallet.findOne({ owner: vendorId, ownerModel: 'Vendor' })
        .select('balance transactions');
  
      if (!wallet) {
        return res.status(404).json({
          status: 'fail',
          message: 'Wallet not found for this vendor'
        });
      }
  
      res.status(200).json({
        status: 'success',
        data: wallet
      });
    } catch (error) {
      res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };
  