/**
 * Test Email Route — For testing email configuration
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { sendOrderConfirmation, sendWelcomeEmail } = require('../utils/emailService');
const User = require('../models/User');
const Order = require('../models/Order');

// Test email endpoint (admin only)
router.get('/test', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Create a mock order for testing
    const testOrder = {
      orderId: 'TEST-' + Date.now(),
      game: { icon: '🎮', title: 'Test Game', currency: 'UC' },
      package: { amount: '100', bonus: 'Test Bonus' },
      gameId: '123456',
      totalAmount: 100,
      status: 'pending',
      paymentMethod: 'demo'
    };

    // Send test email
    const result = await sendOrderConfirmation(user, testOrder);
    
    res.json({
      success: true,
      message: result ? 'Test email sent successfully!' : 'Email not configured or failed',
      email: user.email
    });

  } catch (err) {
    console.error('Test email error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;