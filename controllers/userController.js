// userController.js - Enhanced controller with additional functions
const User = require('../models/userModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const Wishlist = require('../models/wishlistModel');
const Transaction = require('../models/transactionModel');
const Review = require('../models/reviewModel');
const Wallet = require('../models/walletModel');
const { authenticateToken } = require('../middlewares/authMiddleware');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// @desc    Register user
// @route   POST /api/v1/users/register
exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if user exists
    let existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: existingUser.email === email ? 'Email already registered' : 'Phone number already registered'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password
    });

    // Create empty cart and wishlist for user
    await Cart.create({ user: user._id, items: [] });
    await Wishlist.create({ user: user._id, products: [] });

    // Create wallet for vendor
    const wallet = new Wallet({
        owner: user._id,
        ownerModel: 'User'
      });
      await wallet.save();
  
      // Update vendor with wallet reference
      user.wallet = wallet._id;
      await user.save();

    // sendTokenResponse(user, 201, res);
    res.status(201).json({
        success: true,
        data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/v1/users/login
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userAgent = req.headers['user-agent'];
    const ip = req.ip || req.connection.remoteAddress;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLoginDate = Date.now();
    user.loginHistory.push({
      date: Date.now(),
      ipAddress: ip,
      deviceInfo: userAgent
    });
    await user.save();

    // sendTokenResponse(user, 200, res);
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
           
    });
    res.status(200).json({
        success: true,
        token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/v1/users/me
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('orders')
      .populate('wishlist')
      .populate({
        path: 'cart',
        populate: {
          path: 'items.product',
          select: 'name price images'
        }
      });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ['name', 'email', 'phone', 'avatar'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({
        success: false,
        error: 'Invalid updates'
      });
    }

    const user = await User.findById(req.user.id);
    updates.forEach(update => user[update] = req.body[update]);
    await user.save();

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update password
// @route   PUT /api/v1/users/updatepassword
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
           
    });

    res.status(200).json({
        success: true,
        token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/v1/users/deleteaccount
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    await Cart.findOneAndDelete({ user: req.user.id });
    await Wishlist.findOneAndDelete({ user: req.user.id });
    await user.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get user's order history
// @route   GET /api/v1/users/orders
exports.getOrderHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const total = await Order.countDocuments({ user: req.user.id });
    
    const orders = await Order.find({ user: req.user.id })
      .populate('products.product')
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: orders.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        total
      },
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get user's recently viewed products
// @route   GET /api/v1/users/recently-viewed
exports.getRecentlyViewed = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'recentlyViewed',
        populate: {
          path: 'product',
          select: 'name price images description'
        }
      });

    res.status(200).json({
      success: true,
      data: user.recentlyViewed
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Add product to recently viewed
// @route   POST /api/v1/users/recently-viewed/:productId
exports.addToRecentlyViewed = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const productId = req.params.productId;

    // Remove if product already exists
    user.recentlyViewed = user.recentlyViewed.filter(
      item => item.product.toString() !== productId
    );
    
    // Add to beginning of array
    user.recentlyViewed.unshift({
      product: productId,
      viewedAt: Date.now()
    });

    // Keep only last 10 viewed products
    if (user.recentlyViewed.length > 10) {
      user.recentlyViewed = user.recentlyViewed.slice(0, 10);
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: user.recentlyViewed
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Toggle product in wishlist
// @route   POST /api/v1/users/wishlist/:productId
exports.toggleWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    const productId = req.params.productId;

    const index = wishlist.products.indexOf(productId);
    if (index === -1) {
      wishlist.products.push(productId);
    } else {
      wishlist.products.splice(index, 1);
    }

    await wishlist.save();

    res.status(200).json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get user's wishlist
// @route   GET /api/v1/users/wishlist
exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate('products');

    res.status(200).json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Add shipping address
// @route   POST /api/v1/users/address
exports.addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.address.push(req.body);
    await user.save();

    res.status(200).json({
      success: true,
      data: user.address
    });
  } catch (error) { 
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update shipping address
// @route   PUT /api/v1/users/address/:addressId
exports.updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const addressIndex = user.address.findIndex(
      addr => addr._id.toString() === req.params.addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Address not found'
      });
    }

    user.address[addressIndex] = { ...user.address[addressIndex], ...req.body };
    await user.save();

    res.status(200).json({
      success: true,
      data: user.address
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete shipping address
// @route   DELETE /api/v1/users/address/:addressId
exports.deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.addresses = user.addresses.filter(
      addr => addr._id.toString() !== req.params.addressId
    );
    await user.save();

    res.status(200).json({
      success: true,
      data: user.addresses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// // Utility function to send token response
// const sendTokenResponse = (user, statusCode, res) => {
//   const token = user.getSignedJwtToken();

//   res.status(statusCode).json({
//     success: true,
//     token
//   });
// };

// @desc    Get all users with filtering, sorting, and pagination
// @route   GET /api/v1/users
exports.getUsers = async (req, res) => {
    try {
        const queryObj = { ...req.query };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);

        let query = User.find(queryObj);

        // Sorting
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await User.countDocuments(queryObj);

        query = query.skip(startIndex).limit(limit);

        // Execute query
        const users = await query;

        // Pagination result
        const pagination = {};
        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            };
        }
        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            };
        }

        res.status(200).json({
            success: true,
            count: users.length,
            pagination,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get single user
// @route   GET /api/v1/users/:id
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('orders');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get user statistics
// @route   GET /api/v1/users/:id/stats
exports.getUserStats = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('orders')
            .populate('wishlist')
            .populate('cart');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const stats = {
            totalOrders: user.orders.length,
            wishlistItems: user.wishlist ? user.wishlist.length : 0,
            cartItems: user.cart ? user.cart.products.length : 0,
            totalAddresses: user.address.length,
            paymentMethods: user.paymentMethods.length,
            accountAge: new Date(Date.now() - user.createdAt).getUTCFullYear() - 1970
        };

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Bulk delete users
// @route   DELETE /api/v1/users/bulk
exports.bulkDeleteUsers = async (req, res) => {
    try {
        const { userIds } = req.body;

        if (!userIds || !Array.isArray(userIds)) {
            return res.status(400).json({
                success: false,
                error: 'Please provide an array of user IDs'
            });
        }

        await User.deleteMany({ _id: { $in: userIds } });

        res.status(200).json({
            success: true,
            message: `Successfully deleted ${userIds.length} users`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};


// Get User Profile
exports.getUserProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  // Update User Profile
  exports.updateUserProfile = async (req, res) => {
    const { name, email, phone } = req.body;
  
    try {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      user.name = name || user.name;
      user.email = email || user.email;
      user.phone = phone || user.phone;
      await user.save();
  
      res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  // Get User Orders
  exports.getUserOrders = async (req, res) => {
    try {
      const orders = await Order.find({ user: req.user._id });
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  

  // @desc    Add product review
  // @route   POST /api/v1/users/reviews
  exports.addReview = async (req, res) => {
    try {
      const { productId, rating, comment } = req.body;
  
      // Check if user has purchased the product
      const order = await Order.findOne({
        user: req.user.id,
        'products.product': productId,
        deliveryStatus: 'Delivered'
      });
  
      if (!order) {
        return res.status(400).json({
          success: false,
          error: 'You can only review products you have purchased and received'
        });
      }
  
      // Check if the user has already reviewed this product
      const existingReview = await Review.findOne({
        product: productId,
        user: req.user.id
      });
  
      if (existingReview) {
        return res.status(400).json({
          success: false,
          error: 'You have already reviewed this product'
        });
      }
  
      // Create a new Review document
      const newReview = new Review({
        product: productId,
        user: req.user.id,
        rating,
        comment
      });
  
      // Save the new review
      const savedReview = await newReview.save();
  
      // Add the review's ObjectId to the product's reviews array
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }
  
      product.reviews.push(savedReview._id);
  
      // Update product rating
      const reviews = await Review.find({ product: productId });
      const totalRating = reviews.reduce((acc, item) => item.rating + acc, 0);
      product.rating = totalRating / reviews.length;
      product.ratingCount = reviews.length;
  
      await product.save();
  
      res.status(201).json({
        success: true,
        data: savedReview
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };   
  
  // @desc    Get user's wallet
// @route   GET /api/v1/users/wallet
exports.getWallet = async (req, res) => {
    try {
      let wallet = await Wallet.findOne({ owner: req.user.id, ownerModel: 'User' });
      
      if (!wallet) {
        wallet = await Wallet.create({
          user: req.user.id,
          balance: 0,
          transactions: []
        });
      }
  
      res.status(200).json({
        success: true,
        data: wallet
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
  
  // @desc    Add money to wallet
  // @route   POST /api/v1/users/wallet/add
  exports.addMoneyToWallet = async (req, res) => {
    try {
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid amount'
        });
      }
  
      let wallet = await Wallet.findOne({ owner: req.user.id, ownerModel: 'User' });
      
      if (!wallet) {
        wallet = await Wallet.create({
          user: req.user.id,
          balance: amount,
          transactions: []
        });
      } else {
        wallet.balance += amount;
      }
  
      // Create transaction record
      const transaction = await Transaction.create({
        user: req.user.id,
        type: 'CREDIT',
        amount,
        description: 'Added money to wallet',
        status: 'COMPLETED'
      });
  
      wallet.transactions.push(transaction._id);
      await wallet.save();
  
      res.status(200).json({
        success: true,
        data: {
          wallet,
          transaction
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
  
  // @desc    Get wallet transaction history
  // @route   GET /api/v1/users/wallet/transactions
  exports.getWalletTransactions = async (req, res) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const startIndex = (page - 1) * limit;
  
      const total = await Transaction.countDocuments({ user: req.user.id });
      
      const transactions = await Transaction.find({ user: req.user.id })
        .sort('-createdAt')
        .skip(startIndex)
        .limit(limit);
  
      res.status(200).json({
        success: true,
        count: transactions.length,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          total
        },
        data: transactions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
  
  // @desc    Get user's cart
  // @route   GET /api/v1/users/cart
  exports.getCart = async (req, res) => {
    try {
      const cart = await Cart.findOne({ user: req.user.id })
        .populate('items.product');
  
      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found'
        });
      }
  
      // Calculate total
      const total = cart.items.reduce((acc, item) => {
        return acc + (item.product.price * item.quantity);
      }, 0);
  
      res.status(200).json({
        success: true,
        data: {
          items: cart.items,
          total
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
  
  // @desc    Add item to cart
  // @route   POST /api/v1/users/cart
  exports.addToCart = async (req, res) => {
    try {
      const { productId, quantity = 1 } = req.body;
  
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }
  
      let cart = await Cart.findOne({ user: req.user.id });
      
      if (!cart) {
        cart = await Cart.create({
          user: req.user.id,
          items: [{ product: productId, quantity }]
        });
      } else {
        const itemIndex = cart.items.findIndex(
          item => item.product.toString() === productId
        );
  
        if (itemIndex > -1) {
          cart.items[itemIndex].quantity += quantity;
        } else {
          cart.items.push({ product: productId, quantity });
        }
      }
  
      await cart.save();
  
      res.status(200).json({
        success: true,
        data: cart
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
  
  // @desc    Update cart item quantity
  // @route   PUT /api/v1/users/cart/:productId
  exports.updateCartItem = async (req, res) => {
    try {
      const { quantity } = req.body;
      const productId = req.params.productId;
  
      let cart = await Cart.findOne({ user: req.user.id });
      
      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found'
        });
      }
  
      const itemIndex = cart.items.findIndex(
        item => item.product.toString() === productId
      );
  
      if (itemIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Item not found in cart'
        });
      }
  
      if (quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = quantity;
      }
  
      await cart.save();
  
      res.status(200).json({
        success: true,
        data: cart
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
  
  // @desc    Remove item from cart
  // @route   DELETE /api/v1/users/cart/:productId
  exports.removeFromCart = async (req, res) => {
    try {
      const productId = req.params.productId;
      let cart = await Cart.findOne({ user: req.user.id });
      
      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found'
        });
      }
  
      cart.items = cart.items.filter(
        item => item.product.toString() !== productId
      );
  
      await cart.save();
  
      res.status(200).json({
        success: true,
        data: cart
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
  
  // @desc    Checkout cart using wallet
  // @route   POST /api/v1/users/cart/checkout
  exports.checkoutCart = async (req, res) => {
    try {
      // Get the selected shipping address ID from the request body
      const { shippingAddressId } = req.body;
  
      // Find the user's cart
      const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Cart is empty'
        });
      }
  
      // Find the user's wallet
      const wallet = await Wallet.findOne({ owner: req.user.id, ownerModel: 'User' });
      if (!wallet) {
        return res.status(400).json({
          success: false,
          error: 'Wallet not found'
        });
      }
  
      // Fetch the user and find the selected address
      const user = await User.findById(req.user.id);
      const selectedAddress = user.address.id(shippingAddressId);
  
      if (!selectedAddress) {
        return res.status(400).json({
          success: false,
          error: 'Selected shipping address not found'
        });
      }
  
      // Check if the wallet has sufficient balance
      const total = cart.items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
      if (wallet.balance < total) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient wallet balance'
        });
      }
  
      // Generate a unique order number
      const orderNumber = `ORD-${Date.now()}`;
  
      // Create the order using the selected address
      const order = await Order.create({
        orderNumber: orderNumber,
        user: req.user.id,
        products: cart.items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.price
        })),
        totalAmount: total,
        paymentStatus: 'Paid',  // Or any valid payment status enum
        shippingAddress: {
          addressLine1: selectedAddress.addressLine1,
          addressLine2: selectedAddress.addressLine2,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zip: selectedAddress.zip,
          country: selectedAddress.country
        },
        paymentMethod: 'WALLET',
        deliveryStatus: 'Processing'
      });
  
      // Deduct total from the user's wallet
      wallet.balance -= total;
  
      // Create a transaction record
      const transaction = await Transaction.create({
        user: req.user.id,
        type: 'DEBIT',
        amount: total,
        description: `Payment for order ${order._id}`,
        status: 'COMPLETED',
        order: order._id
      });
  
      wallet.transactions.push(transaction._id);
      await wallet.save();
  
      // Clear the cart
      cart.items = [];
      await cart.save();
  
      // Return success response
      res.status(200).json({
        success: true,
        data: {
          order,
          transaction,
          remainingBalance: wallet.balance
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
  
  
  
  // @desc    Get order status
  // @route   GET /api/v1/users/orders/:orderId/status
  exports.getOrderStatus = async (req, res) => {
    try {
      const order = await Order.findOne({
        _id: req.params.orderId,
        user: req.user.id
      }).select('status paymentStatus createdAt updatedAt');
  
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }
  
      res.status(200).json({
        success: true,
        data: order
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
  
  // @desc    Request order cancellation
  // @route   POST /api/v1/users/orders/:orderId/cancel
  exports.requestOrderCancellation = async (req, res) => {
    try {
      const order = await Order.findOne({
        _id: req.params.orderId,
        user: req.user.id
      });
  
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }
  
      if (!['PENDING', 'PROCESSING'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          error: 'Order cannot be cancelled at this stage'
        });
      }
  
      order.cancellationRequested = true;
      order.cancellationReason = req.body.reason || 'No reason provided';
      await order.save();
  
      res.status(200).json({
        success: true,
        data: order
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };