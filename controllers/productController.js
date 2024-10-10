const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const Review = require('../models/reviewModel');
const Inventory = require('../models/inventoryModel');
const Vendor = require('../models/vendorModel');
const Category = require('../models/categoryModel').Category;
const SubCategory = require('../models/categoryModel').SubCategory;

// Create a new product
exports.createProduct = async (req, res) => {
    try {
        // console.log("Request Body:", req.body); // Log the request body

      const vendor = await Vendor.findById(req.body.vendor);
    //   console.log("Fetched Vendor:", vendor); // Log the fetched vendor object
      if (!vendor || vendor.registrationStatus !== 'Approved') {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid or unapproved vendor'
        });
      }
  
      const product = await Product.create(req.body);
      
      // Create inventory entry for the product
      await Inventory.create({
        product: product._id,
        vendor: req.body.vendor,
        currentStock: req.body.stock,
        lowStockThreshold: req.body.lowStockThreshold || 10
      });
  
      res.status(201).json({
        status: 'success',
        data: product
      });
    } catch (error) {
      res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };
  

// Get all products with filtering and sorting
exports.getAllProducts = async (req, res) => {
  try {
    // 1) Filtering
    const queryObj = { ...req.query };
    const excludedFields = ['sort', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    let query = Product.find(JSON.parse(queryStr));

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
    const products = await query.populate('vendor category subcategory');

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: products
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('vendor')
      .populate('category')
      .populate('subcategory')
      .populate('reviews');

    if (!product) {
      return res.status(404).json({
        status: 'fail',
        message: 'No product found with that ID'
      });
    }

    res.status(200).json({
      status: 'success',
      data: product
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!product) {
      return res.status(404).json({
        status: 'fail',
        message: 'No product found with that ID'
      });
    }

    res.status(200).json({
      status: 'success',
      data: product
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        status: 'fail',
        message: 'No product found with that ID'
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

// Get products by vendor
exports.getProductsByVendor = async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.params.vendorId });

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: products
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Search products
exports.searchProducts = async (req, res) => {
  try {
    const { query } = req.query;
    
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    }).populate('vendor category subcategory');

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: products
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Get top rated products
exports.getTopRatedProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: 'Active' })
      .sort('-rating')
      .populate('vendor');

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: products
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Update product stock
exports.updateProductStock = async (req, res) => {
  try {
    const { stock } = req.body;
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { 
        stock,
        status: stock > 0 ? 'Active' : 'Out of Stock'
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      return res.status(404).json({
        status: 'fail',
        message: 'No product found with that ID'
      });
    }

    res.status(200).json({
      status: 'success',
      data: product
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Get product sales analytics
exports.getProductSalesAnalytics = async (req, res) => {
    try {
      const productId = req.params.id;
      const { startDate, endDate } = req.query;
  
      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
  
      const salesData = await Order.aggregate([
        {
          $match: {
            'products.product': productId,
            ...dateFilter
          }
        },
        { $unwind: "$products" },
        { $match: { 'products.product': productId } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            quantitySold: { $sum: "$products.quantity" },
            revenue: { $sum: { $multiply: ["$products.price", "$products.quantity"] } }
          }
        },
        { $sort: { _id: 1 } }
      ]);
  
      res.status(200).json({
        status: 'success',
        data: salesData
      });
    } catch (error) {
      res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };
  
  // Get related products
  exports.getRelatedProducts = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      
      if (!product) {
        return res.status(404).json({
          status: 'fail',
          message: 'No product found with that ID'
        });
      }
  
      const relatedProducts = await Product.find({
        _id: { $ne: product._id },
        $or: [
          { category: product.category },
          { tags: { $in: product.tags } }
        ]
      }).limit(5);
  
      res.status(200).json({
        status: 'success',
        data: relatedProducts
      });
    } catch (error) {
      res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };
  
  // Get product review analytics
  exports.getReviewAnalytics = async (req, res) => {
    try {
      const productId = req.params.id;
      
      const reviewAnalytics = await Review.aggregate([
        { $match: { product: productId } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
            ratingDistribution: {
              $push: {
                rating: "$rating"
              }
            }
          }
        },
        {
          $project: {
            averageRating: 1,
            totalReviews: 1,
            ratingDistribution: {
              5: { $size: { $filter: { input: "$ratingDistribution", cond: { $eq: ["$$this.rating", 5] } } } },
              4: { $size: { $filter: { input: "$ratingDistribution", cond: { $eq: ["$$this.rating", 4] } } } },
              3: { $size: { $filter: { input: "$ratingDistribution", cond: { $eq: ["$$this.rating", 3] } } } },
              2: { $size: { $filter: { input: "$ratingDistribution", cond: { $eq: ["$$this.rating", 2] } } } },
              1: { $size: { $filter: { input: "$ratingDistribution", cond: { $eq: ["$$this.rating", 1] } } } }
            }
          }
        }
      ]);
  
      res.status(200).json({
        status: 'success',
        data: reviewAnalytics[0] || {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        }
      });
    } catch (error) {
      res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };
  
  // Update product price history
  exports.updatePriceHistory = async (req, res) => {
    try {
      const productId = req.params.id;
      const { price } = req.body;
  
      const product = await Product.findById(productId);
      
      if (!product) {
        return res.status(404).json({
          status: 'fail',
          message: 'No product found with that ID'
        });
      }
  
      product.priceHistory = product.priceHistory || [];
      product.priceHistory.push({
        price: product.price,
        date: new Date()
      });
      product.price = price;
  
      await product.save();
  
      res.status(200).json({
        status: 'success',
        data: product
      });
    } catch (error) {
      res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };
  
  // Get frequently bought together products
  exports.getFrequentlyBoughtTogether = async (req, res) => {
    try {
      const productId = req.params.id;
      
      const frequentlyBoughtTogether = await Order.aggregate([
        { $match: { 'products.product': productId } },
        { $unwind: "$products" },
        {
          $group: {
            _id: "$products.product",
            count: { $sum: 1 }
          }
        },
        { $match: { _id: { $ne: productId } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
  
      const relatedProductIds = frequentlyBoughtTogether.map(item => item._id);
      const relatedProducts = await Product.find({ _id: { $in: relatedProductIds } });
  
      res.status(200).json({
        status: 'success',
        data: relatedProducts
      });
    } catch (error) {
      res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };
  
  // Update product attributes
  exports.updateProductAttributes = async (req, res) => {
    try {
      const productId = req.params.id;
      const { attributes } = req.body;
  
      const product = await Product.findByIdAndUpdate(
        productId,
        { $set: { attributes } },
        { new: true }
      );
  
      if (!product) {
        return res.status(404).json({
          status: 'fail',
          message: 'No product found with that ID'
        });
      }
  
      res.status(200).json({
        status: 'success',
        data: product
      });
    } catch (error) {
      res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };

//   Get product inventory
exports.getProductInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findOne({ product: req.params.id })
      .populate('product')
      .populate('vendor');

    if (!inventory) {
      return res.status(404).json({
        status: 'fail',
        message: 'No inventory found for this product'
      });
    }

    res.status(200).json({
      status: 'success',
      data: inventory
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// New function: Get products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const products = await Product.find({ category: categoryId })
      .populate('vendor')
      .populate('category')
      .populate('subcategory');

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: products
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// New function: Get products by subcategory
exports.getProductsBySubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
    
    const products = await Product.find({ subcategory: subcategoryId })
      .populate('vendor')
      .populate('category')
      .populate('subcategory');

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: products
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// New function: Get trending products
exports.getTrendingProducts = async (req, res) => {
  try {
    const trendingProducts = await Order.aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          totalSold: { $sum: "$products.quantity" }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    const productIds = trendingProducts.map(item => item._id);
    const products = await Product.find({ _id: { $in: productIds } })
      .populate('vendor')
      .populate('category')
      .populate('subcategory');

    res.status(200).json({
      status: 'success',
      data: products
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// New function: Get new arrivals
exports.getNewArrivals = async (req, res) => {
  try {
    const newArrivals = await Product.find()
      .sort('-createdAt')
      .limit(10)
      .populate('vendor')
      .populate('category')
      .populate('subcategory');

    res.status(200).json({
      status: 'success',
      data: newArrivals
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Update product review stats
exports.updateProductReviewStats = async (req, res) => {
  try {
    const productId = req.params.id;
    
    const stats = await Review.aggregate([
      { $match: { product: productId } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          numReviews: { $sum: 1 }
        }
      }
    ]);

    const updateData = stats.length > 0
      ? { rating: stats[0].avgRating, $push: { reviews: req.body.reviewId } }
      : { rating: 0, reviews: [] };

    const product = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        status: 'fail',
        message: 'No product found with that ID'
      });
    }

    res.status(200).json({
      status: 'success',
      data: product
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};