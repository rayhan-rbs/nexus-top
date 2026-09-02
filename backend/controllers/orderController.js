/**
 * Order Controller — Business Logic
 */

const Order = require('../models/Order');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    console.log("📥 Received order request body:", req.body);
    console.log("👤 User from token:", req.user ? req.user.id : "UNDEFINED");

    // renamed 'package' to 'pkg' to avoid any JS reserved word conflicts
    const { game, package: pkg, gameId, paymentMethod, note } = req.body;

    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated. Please login again.' 
      });
    }

    if (!game || !pkg || !gameId) {
      return res.status(400).json({
        success: false,
        error: 'Game, package, and game ID are required'
      });
    }

    // Ensure price is a valid Number for Mongoose
    const finalPrice = Number(pkg.price);
    if (isNaN(finalPrice)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid package price' 
      });
    }

    // Create order
    const order = await Order.create({
      user: req.user.id,
      game,
      package: pkg,
      gameId,
      paymentMethod: paymentMethod || 'manual',
      note: note || '',
      totalAmount: finalPrice
    });

    // Populate user info
    await order.populate('user', 'name email');


    // Send order confirmation email (async - don't block response)
    try {
      const { sendOrderConfirmation } = require('../utils/emailService');
      const User = require('../models/User');
      const user = await User.findById(req.user.id);
      if (user) {
        sendOrderConfirmation(user, order); // No await - fire and forget
      }
    } catch (err) {
      console.error('Email send failed (non-critical):', err.message);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });

  } catch (err) {
    // This will print the EXACT reason in your backend terminal
    console.error('❌ Create order error details:', err); 
    
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to create order' // Sends actual error to frontend for debugging
    });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      count: orders.length,
      orders
    });

  } catch (err) {
    console.error('Get my orders error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      order
    });

  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order'
    });
  }
};

// @desc    Get all orders (admin only)
// @route   GET /api/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: orders.length,
      orders
    });

  } catch (err) {
    console.error('Get all orders error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
};

// @desc    Update order status (admin only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, cancelledReason } = req.body;

    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    order.status = status;

    if (status === 'completed') {
      order.deliveredAt = Date.now();
      order.paymentStatus = 'paid';
    } else if (status === 'cancelled') {
      order.cancelledAt = Date.now();
      order.cancelledReason = cancelledReason || 'Cancelled by admin';
    }else if (status === 'processing') {
      order.deliveredAt = Date.now();
      order.paymentStatus = 'paid';

    await order.save();

    // Send status update email
    try {
      const { sendOrderStatusUpdate } = require('../utils/emailService');
      const User = require('../models/User');
      const user = await User.findById(order.user);
      if (user) {
        sendOrderStatusUpdate(user, order, status, cancelledReason);
      }
    } catch (err) {
      console.error('Email send failed (non-critical):', err.message);
    }

    res.json({
      success: true,
      message: 'Order status updated',
      order
    });

  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update order'
    });
  }
};

// @desc    Cancel order (user)
// @route   PUT /api/orders/:id/cancel
// @access  Private
// @desc    Cancel order (user)
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
  try {
    let order = await Order.findById(req.params.id);

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
        error: 'Not authorized to cancel this order'
      });
    }

    // Can only cancel pending orders
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Can only cancel pending orders'
      });
    }

    // ✅ ৫ মিনিটের ক্যানসেলেশন উইন্ডো চেক
    const orderTime = new Date(order.createdAt).getTime();
    const now = Date.now();
    const FIVE_MINUTES = 5 * 60 * 1000; // 5 মিনিট = 300,000 মিলিসেকেন্ড
    const timeDiff = now - orderTime;

    if (timeDiff > FIVE_MINUTES) {
      const minutesPassed = Math.floor(timeDiff / 60000);
      return res.status(400).json({
        success: false,
        error: `Cancellation window expired. Order was placed ${minutesPassed} minutes ago. Orders can only be cancelled within 5 minutes.`
      });
    }

    order.status = 'cancelled';
    order.cancelledAt = Date.now();
    order.cancelledReason = req.body.reason || 'Cancelled by user';

    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });

  } catch (err) {
    console.error('Cancel order error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order'
    });
  }
};