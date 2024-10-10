const express = require('express');
const vendorController = require('../controllers/vendorController');
const router = express.Router();

// Authentication routes (assuming middleware exists)
router.post('/register', vendorController.registerVendor);

// Profile management
router.put('/:id/profile', vendorController.updateVendorProfile);
router.patch('/:id/business-documents', vendorController.updateBusinessDocuments);

// Inventory management
router.post('/:id/inventory-request', vendorController.createInventoryRequest);
router.get('/inventory/:id/inventory-summary', vendorController.getInventorySummary);
router.patch('/:id/manage-inventory', vendorController.manageInventory);

// Analytics and reporting
router.get('/:id/analytics', vendorController.getVendorAnalytics);
router.get('/:id/wallet-transactions', vendorController.getWalletTransactions);
router.get('/:id/revenue', vendorController.getVendorRevenue);
router.get('/:id/performance-metrics', vendorController.getPerformanceMetrics);
router.get('/:id/customer-feedback', vendorController.getCustomerFeedback);
router.get('/:id/best-selling-products', vendorController.getBestSellingProducts);

// Operational routes
router.patch('/:id/business-hours', vendorController.updateBusinessHours);
router.patch('/:id/availability-status', vendorController.updateAvailabilityStatus);

// Order management
router.get('/:id/orders', vendorController.viewOrders);

// General CRUD operations
router.get('/', vendorController.getAllVendors);
router.get('/top', vendorController.getTopVendors);
router.get('/stats', vendorController.getVendorStats);
router.get('/:id', vendorController.getVendorById);
router.put('/:id', vendorController.updateVendor);
router.delete('/:id', vendorController.deleteVendor);

// Admin routes
router.patch('/:id/registration-status', vendorController.updateRegistrationStatus);
router.patch('/:id/ratings', vendorController.updateVendorRatings);

router.get('/vendor/:vendorId/profile', vendorController.getVendorProfileByVendorId);

module.exports = router;