const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protectAdmin } = require('../middlewares/authMiddleware');

// Auth routes
router.post('/login', adminController.login);

// Admin management routes
router.post('/create', adminController.createAdmin);
router.get('/all', protectAdmin, adminController.getAllAdmins);

// User management routes
router.get('/users', protectAdmin, adminController.getAllUsers);
router.put('/users/:id', protectAdmin, adminController.updateUser);

// Vendor management routes
router.put('/vendors/:id/approve', protectAdmin, adminController.approveVendor);

// Product management routes
router.get('/products', protectAdmin, adminController.getAllProducts);

// Category management routes
router.post('/categories', protectAdmin, adminController.createCategory);
router.post('/subcategories', protectAdmin, adminController.createSubCategory);

// Analytics routes
router.get('/analytics', protectAdmin, adminController.getAnalytics);

// Order management routes
router.get('/orders', protectAdmin, adminController.getAllOrders);

// Advanced Product Management Routes
router.put('/products/:id/status', protectAdmin, adminController.updateProductStatus);
router.put('/products/bulk-update', protectAdmin, adminController.bulkUpdateProducts);

// Advanced Order Management Routes
router.put('/orders/:id/status', protectAdmin, adminController.updateOrderStatus);
router.get('/analytics/orders', protectAdmin, adminController.getOrderAnalytics);

// Advanced User Management Routes
router.get('/analytics/users', protectAdmin, adminController.getUserAnalytics);

// Advanced Vendor Management Routes
router.get('/analytics/vendors', protectAdmin, adminController.getVendorAnalytics);

// Inventory Management Routes
router.get('/analytics/inventory', protectAdmin, adminController.getInventoryAnalytics);

// Advanced Category Management Routes
router.put('/categories/:id', protectAdmin, adminController.updateCategory);
router.delete('/categories/:id', protectAdmin, adminController.deleteCategory);
router.put('/subcategories/:id', protectAdmin, adminController.updateSubCategory);
router.delete('/subcategories/:id', protectAdmin, adminController.deleteSubCategory);


module.exports = router;
