const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/search', productController.searchProducts);
router.get('/top-rated', productController.getTopRatedProducts);
router.get('/trending', productController.getTrendingProducts);
router.get('/new-arrivals', productController.getNewArrivals);
router.get('/:id', productController.getProductById);
router.get('/category/:categoryId', productController.getProductsByCategory);
router.get('/subcategory/:subcategoryId', productController.getProductsBySubcategory);
router.get('/vendor/:vendorId', productController.getProductsByVendor);
router.get('/:id/related', productController.getRelatedProducts);
router.get('/:id/frequently-bought-together', productController.getFrequentlyBoughtTogether);



// Vendor routes
router.post('/', productController.createProduct);
router.patch('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.get('/:id/inventory', productController.getProductInventory);
router.patch('/:id/stock', productController.updateProductStock);
router.patch('/:id/attributes', productController.updateProductAttributes);
router.post('/:id/price-history', productController.updatePriceHistory);
router.patch('/:id/review-stats', productController.updateProductReviewStats);

// Admin only routes
router.get('/:id/sales-analytics', productController.getProductSalesAnalytics);
router.get('/:id/review-analytics', productController.getReviewAnalytics);

module.exports = router;