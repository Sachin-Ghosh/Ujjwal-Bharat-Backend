const Admin = require('../models/adminModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const Review = require('../models/reviewModel');
const Inventory = require('../models/inventoryModel');
const Vendor = require('../models/vendorModel');
const Category = require('../models/categoryModel').Category;
const SubCategory = require('../models/categoryModel').SubCategory;
const Analytics = require('../models/analyticModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper function to check permissions
const checkPermission = (admin, entity, action) => {
    if (admin.role === 'super_admin') return true;
    return admin.permissions[entity] && admin.permissions[entity][action];
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email }).select('+password');
        
        if (!admin || !(await admin.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        admin.lastLogin = Date.now();
        await admin.save();

        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
           
        });

        res.status(200).json({
            success: true,
            token
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
};

// Admin Management
exports.createAdmin = async (req, res) => {
    try {
        const newAdmin = await Admin.create(req.body);
        res.status(201).json({
            success: true,
            data: newAdmin
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Admin creation failed',
            error: error.message
        });
    }
};

exports.getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find();
        res.status(200).json({
            success: true,
            count: admins.length,
            data: admins
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Could not fetch admins',
            error: error.message
        });
    }
};

// User Management
exports.getAllUsers = async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'users', 'read')) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        const users = await User.find();
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Could not fetch users',
            error: error.message
        });
    }
};

exports.updateUser = async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'users', 'update')) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Could not update user',
            error: error.message
        });
    }
};

// Vendor Management
exports.approveVendor = async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'vendors', 'approve')) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        const vendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            {
                registrationStatus: 'Approved',
                isActive: true,
                registrationComments: req.body.comments
            },  
            { new: true }
        );

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        res.status(200).json({
            success: true,
            data: vendor
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Could not approve vendor',
            error: error.message
        });
    }
};

// Product Management
exports.getAllProducts = async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'products', 'read')) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        const products = await Product.find().populate('vendor', 'businessName');
        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Could not fetch products',
            error: error.message
        });
    }
};

// Category Management
exports.createCategory = async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'categories', 'create')) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        const category = await Category.create(req.body);
        res.status(201).json({
            success: true,
            data: category
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Could not create category',
            error: error.message
        });
    }
};
// Category Management
exports.createSubCategory = async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'subcategories', 'create')) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        // Create the subcategory first
        const subcategory = await SubCategory.create(req.body);

        // Find the related category and push the subcategory into its array
        const category = await Category.findByIdAndUpdate(
            subcategory.category,  // Use the category field from the subcategory
            { $push: { subcategories: subcategory._id } },  // Push the subcategory ID into the array
            { new: true, useFindAndModify: false }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.status(201).json({
            success: true,
            data: subcategory,
            message: 'Subcategory created and added to the category successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Could not create subcategory',
            error: error.message
        });
    }
};


// Analytics
exports.getAnalytics = async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'analytics', true)) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        const analytics = await Analytics.find();
        const totalUsers = await User.countDocuments();
        const totalVendors = await Vendor.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();

        res.status(200).json({
            success: true,
            data: {
                analytics,
                summary: {
                    totalUsers,
                    totalVendors,
                    totalProducts,
                    totalOrders
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Could not fetch analytics',
            error: error.message
        });
    }
};

// Order Management
exports.getAllOrders = async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'orders', 'read')) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        const orders = await Order.find()
            .populate('user', 'name email')
            .populate('vendor', 'businessName');
        
        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Could not fetch orders',
            error: error.message
        });
    }
};

// Advanced Product Management
exports.updateProductStatus = async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'products', 'update')) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        const { status } = req.body;
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Could not update product status',
            error: error.message
        });
    }
};

exports.bulkUpdateProducts = async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'products', 'update')) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        const { productIds, updateData } = req.body;
        const updatedProducts = await Product.updateMany(
            { _id: { $in: productIds } },
            updateData,
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: `Updated ${updatedProducts.modifiedCount} products`
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Bulk update failed',
            error: error.message
        });
    }
};

// Advanced Order Management
exports.updateOrderStatus = async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'orders', 'update')) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        const { status, comments } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { 
                deliveryStatus: status,
                $push: { 
                    comments: {
                        user: req.admin._id,
                        message: comments,
                        date: Date.now()
                    }
                }
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Could not update order status',
            error: error.message
        });
    }
};

exports.getOrderAnalytics = async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'analytics', true)) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        const pipeline = [
            {
                $group: {
                    _id: '$deliveryStatus',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' }
                }
            }
        ];

        const orderAnalytics = await Order.aggregate(pipeline);

        res.status(200).json({
            success: true,
            data: orderAnalytics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Could not fetch order analytics',
            error: error.message
        });
    }
};

// Advanced User Management
exports.getUserAnalytics = async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'analytics', true)) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        const totalUsers = await User.countDocuments();
        const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const newUsers = await User.countDocuments({ createdAt: { $gte: last30Days } });
        
        const userOrders = await Order.aggregate([
            {
                $group: {
                    _id: '$user',
                    orderCount: { $sum: 1 },
                    totalSpent: { $sum: '$totalAmount' }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                newUsers,
                userOrders
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Could not fetch user analytics',
            error: error.message
        });
    }
};

// Advanced Vendor Management
exports.getVendorAnalytics = async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'analytics', true)) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        const vendorAnalytics = await Vendor.aggregate([
            {
                $lookup: {
                    from: 'orders',
                    localField: '_id',
                    foreignField: 'vendor',
                    as: 'orders'
                }
            },
            {
                $project: {
                    businessName: 1,
                    registrationStatus: 1,
                    totalOrders: { $size: '$orders' },
                    totalRevenue: {
                        $sum: '$orders.totalAmount'
                    }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: vendorAnalytics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Could not fetch vendor analytics',
            error: error.message
        });
    }
};

// Inventory Management
exports.getInventoryAnalytics = async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'analytics', true)) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
            .populate('vendor', 'businessName');

        const outOfStockProducts = await Product.find({ stock: 0 })
            .populate('vendor', 'businessName');

        res.status(200).json({
            success: true,
            data: {
                lowStockProducts,
                outOfStockProducts
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Could not fetch inventory analytics',
            error: error.message
        });
    }
};

// Category Management
exports.updateCategory = async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'categories', 'update')) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Could not update category',
            error: error.message
        });
    }
};
// Category Management
exports.updateSubCategory = async (req, res) => {
    try {
        const { name, description, image, category } = req.body;

        // Check permissions
        if (!checkPermission(req.admin, 'subcategories', 'update')) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        // Update the subcategory
        const subcategory = await SubCategory.findByIdAndUpdate(
            req.params.id,
            { name, description, image, category },
            { new: true, runValidators: true }
        );

        if (!subcategory) {
            return res.status(404).json({
                success: false,
                message: 'Subcategory not found'
            });
        }

        // Update the category if the category ID has changed
        if (category) {
            // Remove subcategory ID from the old category's subcategories array
            await Category.findByIdAndUpdate(
                subcategory.category,
                { $pull: { subcategories: req.params.id } },
                { useFindAndModify: false }
            );

            // Add subcategory ID to the new category's subcategories array
            await Category.findByIdAndUpdate(
                category,
                { $addToSet: { subcategories: subcategory._id } }, // Use $addToSet to prevent duplicates
                { useFindAndModify: false }
            );
        }

        res.status(200).json({
            success: true,
            data: subcategory
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Could not update subcategory',
            error: error.message
        });
    }
};


exports.deleteCategory = async (req, res) => {
    try {
        if (!checkPermission(req.admin, 'categories', 'delete')) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Check if category has products
        const productsInCategory = await Product.countDocuments({ category: req.params.id });
        if (productsInCategory > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete category with existing products'
            });
        }

        await category.remove();

        res.status(200).json({
            success: true,
            message: 'Category successfully deleted'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Could not delete category',
            error: error.message
        });
    }
};
// Category Management
exports.deleteSubCategory = async (req, res) => {
    try {
        // Check permissions
        if (!checkPermission(req.admin, 'subcategories', 'delete')) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        // Find the subcategory and delete it
        const subcategory = await SubCategory.findById(req.params.id);

        if (!subcategory) {
            return res.status(404).json({
                success: false,
                message: 'Subcategory not found'
            });
        }

        // Remove the subcategory from the category's subcategories array
        await Category.findByIdAndUpdate(
            subcategory.category,
            { $pull: { subcategories: req.params.id } },
            { useFindAndModify: false }
        );

        // Delete the subcategory
        await subcategory.remove();

        res.status(200).json({
            success: true,
            message: 'Subcategory deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Could not delete subcategory',
            error: error.message
        });
    }
};
