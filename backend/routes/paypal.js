const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createOrder, capturePayment } = require('../controllers/paypalController');

router.post('/create-order', protect, createOrder);
router.post('/capture', protect, capturePayment);

module.exports = router;