const Vendor = require('../models/vendorModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');

exports.registerVendor = async (req, res) => {
  
    try {
    //   let vendor = await Vendor.findOne({ email });
    //   if (vendor) return res.status(400).json({ message: 'Vendor already exists' });
  
      const vendor = new Vendor(req.body);
      await vendor.save();
  
      res.status(201).json({ message: 'Vendor registered successfully', vendor });
    } catch (error) {
      res.status(500).json({ error: error.message });
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
    const vendor = await Vendor.findById(req.params.id)
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
    
    vendor.ratings.totalReviews += 1;
    vendor.ratings.averageRating = 
      ((vendor.ratings.averageRating * (vendor.ratings.totalReviews - 1)) + rating) / 
      vendor.ratings.totalReviews;

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
  
      const vendor = await Vendor.findByIdAndUpdate(
        vendorId,
        {
          isAvailable,
          unavailabilityReason: isAvailable ? null : unavailabilityReason
        },
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
  
  // Update vendor delivery areas
  exports.updateDeliveryAreas = async (req, res) => {
    try {
      const vendorId = req.params.id;
      const { deliveryAreas } = req.body;
  
      const vendor = await Vendor.findByIdAndUpdate(
        vendorId,
        { $set: { deliveryAreas } },
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
      const orders = await Order.find({ vendor: req.vendor._id });
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