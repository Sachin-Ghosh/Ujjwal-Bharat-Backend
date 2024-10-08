const express = require('express');
const vendorController = require('../controllers/vendorController');

const router = express.Router();

// Vendor registration
router.post('/register', vendorController.registerVendor);

// Get all vendors with filtering, sorting, and field limiting
router.get('/', vendorController.getAllVendors);

// Get vendor by ID
router.get('/:id', vendorController.getVendorById);

// Update vendor details by ID
router.put('/:id', vendorController.updateVendor);

// Delete vendor by ID
router.delete('/:id', vendorController.deleteVendor);

// Get vendor statistics
router.get('/stats', vendorController.getVendorStats);

// Update vendor registration status
router.patch('/:id/registration-status', vendorController.updateRegistrationStatus);

// Get top performing vendors
router.get('/top', vendorController.getTopVendors);

// Update vendor ratings
router.patch('/:id/ratings', vendorController.updateVendorRatings);

// Get vendor revenue analytics
router.get('/:id/revenue', vendorController.getVendorRevenue);

// Get vendor inventory summary
router.get('/:id/inventory-summary', vendorController.getInventorySummary);

// Update vendor business hours
router.patch('/:id/business-hours', vendorController.updateBusinessHours);

// Get vendor performance metrics
router.get('/:id/performance-metrics', vendorController.getPerformanceMetrics);

// Update vendor availability status
router.patch('/:id/availability-status', vendorController.updateAvailabilityStatus);

// Get vendor customer feedback
router.get('/:id/customer-feedback', vendorController.getCustomerFeedback);

// Update vendor delivery areas
router.patch('/:id/delivery-areas', vendorController.updateDeliveryAreas);

// Get vendor's best-selling products
router.get('/:id/best-selling-products', vendorController.getBestSellingProducts);

// View vendor's orders
router.get('/:id/orders', vendorController.viewOrders);

// Manage inventory for a product
router.post('/:id/manage-inventory', vendorController.manageInventory);

module.exports = router;
