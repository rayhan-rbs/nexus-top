/**
 * Payment Controller
 */

const Order = require('../models/Order');
const paymentConfig = require('../config/payment');

// @desc    Get payment methods info
// @route   GET /api/payments/methods
// @access  Public
exports.getPaymentMethods = (req, res) => {
  res.json({
    success: true,
    methods: [
      {
        id: 'paypal',
        name: 'PayPal',
        description: 'Pay with PayPal (International)',
        icon: '💳',
        enabled: true
      },
      {
        id: 'bkash',
        name: 'bKash',
        description: `Send money to ${paymentConfig.manual.bkash.number}`,
        icon: '📱',
        number: paymentConfig.manual.bkash.number,
        type: paymentConfig.manual.bkash.type,
        enabled: true
      },
      {
        id: 'nagad',
        name: 'Nagad',
        description: `Send money to ${paymentConfig.manual.nagad.number}`,
        icon: '📱',
        number: paymentConfig.manual.nagad.number,
        type: paymentConfig.manual.nagad.type,
        enabled: true
      },
      {
        id: 'rocket',
        name: 'Rocket',
        description: `Send money to ${paymentConfig.manual.rocket.number}`,
        icon: '📱',
        number: paymentConfig.manual.rocket.number,
        type: paymentConfig.manual.rocket.type,
        enabled: true
      },
      {
        id: 'demo',
        name: 'Demo Payment',
        description: 'Testing only - No real payment',
        icon: '🎮',
        enabled: paymentConfig.demo.enabled
      }
    ]
  });
};

// @desc    Create PayPal order
// @route   POST /api/payments/paypal/create
// @access  Private
exports.createPayPalOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if user owns this order
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // TODO: Integrate PayPal SDK here
    // For now, return mock PayPal order ID
    const paypalOrderId = 'PAYPAL-' + Date.now();

    res.json({
      success: true,
      paypalOrderId
    });

  } catch (err) {
    console.error('PayPal create error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create PayPal order'
    });
  }
};

// @desc    Capture PayPal payment
// @route   POST /api/payments/paypal/capture
// @access  Private
exports.capturePayPalPayment = async (req, res) => {
  try {
    const { orderId, paypalOrderId } = req.body;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // TODO: Verify with PayPal API
    // For now, mark as paid
    order.paymentMethod = 'paypal';
    order.paymentStatus = 'paid';
    order.transactionId = paypalOrderId;
    order.status = 'processing';
    
    await order.save();

    // Send payment success email
    try {
      const { sendPaymentSuccess } = require('../utils/emailService');
      const User = require('../models/User');
      const user = await User.findById(order.user);
      if (user) {
        sendPaymentSuccess(user, order);
      }
    } catch (err) {
      console.error('Email send failed (non-critical):', err.message);
    }

    res.json({
      success: true,
      message: 'PayPal payment successful',
      order
    });

  } catch (err) {
    console.error('PayPal capture error:', err);
    res.status(500).json({
      success: false,
      error: 'Payment failed'
    });
  }
};

// @desc    Submit manual payment proof
// @route   POST /api/payments/manual
// @access  Private
exports.submitManualPayment = async (req, res) => {
  try {
    const { orderId, transactionId, paymentMethod } = req.body;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    order.paymentMethod = paymentMethod;
    order.transactionId = transactionId;
    order.paymentStatus = 'pending_verification';
    order.status = 'pending_verification';
    
    await order.save();

    res.json({
      success: true,
      message: 'Payment submitted for verification',
      order
    });

  } catch (err) {
    console.error('Manual payment error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to submit payment'
    });
  }
};

// @desc    Demo payment (testing only)
// @route   POST /api/payments/demo
// @access  Private
// @desc    Demo payment (testing only)
// @route   POST /api/payments/demo
// @access  Private
exports.demoPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Safe user ID check
    const userId = order.user._id ? order.user._id.toString() : order.user.toString();
    if (userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to pay for this order'
      });
    }

    // Mark as paid instantly (demo mode)
    order.paymentMethod = 'demo';
    order.paymentStatus = 'paid';
    order.transactionId = 'DEMO-' + Date.now();
    order.status = 'completed';
    order.deliveredAt = Date.now();
    
    await order.save();

    // Send payment success email
    try {
      const { sendPaymentSuccess } = require('../utils/emailService');
      const User = require('../models/User');
      const user = await User.findById(order.user);
      if (user) {
        sendPaymentSuccess(user, order);
      }
    } catch (err) {
      console.error('Email send failed (non-critical):', err.message);
    }

    res.json({
      success: true,
      message: 'Demo payment successful - Order completed!',
      order
    });

  } catch (err) {
    console.error('❌ Demo payment error details:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Demo payment failed'
    });
  }
};