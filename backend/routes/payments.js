/**
 * Payment Routes
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPaymentMethods,
  createPayPalOrder,
  capturePayPalPayment,
  submitManualPayment,
  demoPayment
} = require('../controllers/paymentController');

// Public routes
router.get('/methods', getPaymentMethods);

// Private routes
router.post('/paypal/create', protect, createPayPalOrder);
router.post('/paypal/capture', protect, capturePayPalPayment);
router.post('/manual', protect, submitManualPayment);
router.post('/demo', protect, demoPayment);

module.exports = router;