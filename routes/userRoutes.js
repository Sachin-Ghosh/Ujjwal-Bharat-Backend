const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
// const { protect } = require('../middlewares/authController');
const userController = require('../controllers/userController');

// Public routes
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// // Protected routes - require authentication
// router.use(authenticateToken); // Apply protection middleware to all routes below

// User profile routes
router.get('/me', authenticateToken, userController.getCurrentUser);
router.put('/profile',authenticateToken, userController.updateProfile);
router.put('/updatepassword',authenticateToken, userController.updatePassword);
router.delete('/deleteaccount',authenticateToken, userController.deleteAccount);

// Address routes
router.post('/address',authenticateToken, userController.addAddress);
router.put('/address/:addressId',authenticateToken, userController.updateAddress);
router.delete('/address/:addressId', authenticateToken, userController.deleteAddress);

// Order routes
router.get('/orders', authenticateToken,userController.getOrderHistory);
router.get('/orders/:orderId/status',authenticateToken, userController.getOrderStatus);
router.post('/orders/:orderId/cancel',authenticateToken, userController.requestOrderCancellation);

// Review routes
router.post('/reviews', authenticateToken,userController.addReview);

// Wallet routes
router.get('/wallet',authenticateToken, userController.getWallet);
router.post('/wallet/add', authenticateToken,userController.addMoneyToWallet);
router.get('/wallet/transactions', authenticateToken,userController.getWalletTransactions);

// Cart routes
router.get('/cart',authenticateToken, userController.getCart);
router.post('/cart', authenticateToken,userController.addToCart);
router.put('/cart/:productId', authenticateToken,userController.updateCartItem);
router.delete('/cart/:productId', authenticateToken,userController.removeFromCart);
router.post('/cart/checkout', authenticateToken,userController.checkoutCart);

// Wishlist routes
router.post('/wishlist/:productId',authenticateToken, userController.toggleWishlist);
router.get('/wishlist',authenticateToken, userController.getWishlist);

// Recently viewed routes
router.get('/recently-viewed',authenticateToken, userController.getRecentlyViewed);
router.post('/recently-viewed/:productId',authenticateToken, userController.addToRecentlyViewed);

// Admin routes - might need additional admin middleware
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.get('/:id/stats', userController.getUserStats);
router.delete('/bulk', userController.bulkDeleteUsers);

module.exports = router;