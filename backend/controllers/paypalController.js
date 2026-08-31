const paypal = require('@paypal/checkout-server-sdk');
const Order = require('../models/Order'); // 👈 এই লাইনটি যোগ করতে হবে (সবচেয়ে গুরুত্বপূর্ণ)

// PayPal Environment সেটআপ
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  if (process.env.PAYPAL_MODE === 'sandbox') {
    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
  } else {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  }
}

function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

// @desc    Create PayPal Order
// @route   POST /api/payments/paypal/create-order
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    // এখন Order মডেলটি কাজ করবে
    const order = await Order.findById(orderId).populate('user', 'name email');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if user owns this order
    if (order.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to pay for this order'
      });
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: order.totalAmount.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: 'USD',
              value: order.totalAmount.toFixed(2)
            }
          }
        },
        description: `Gaming Top-up: ${order.game.title} - ${order.package.amount} ${order.game.currency}`,
        custom_id: order._id.toString()
      }],
      application_context: {
        return_url: `${process.env.FRONTEND_URL}/orders.html`, 
        cancel_url: `${process.env.FRONTEND_URL}/orders.html`,
        brand_name: 'NexusTop Gaming',
        user_action: 'PAY_NOW'
      }
    });

    const response = await client().execute(request);
    
    res.json({
      success: true,
      approveUrl: response.result.links.find(link => link.rel === 'approve').href,
      orderId: response.result.id
    });

  } catch (err) {
    console.error('❌ PayPal create order error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to create PayPal order'
    });
  }
};

// @desc    Capture PayPal Payment
// @route   POST /api/payments/paypal/capture
// @access  Private
exports.capturePayment = async (req, res) => {
  try {
    const { orderId, paypalOrderId } = req.body;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({});
    
    const response = await client().execute(request);
    
    if (response.result.status === 'COMPLETED') {
      // Update order
      order.paymentMethod = 'paypal';
      order.paymentStatus = 'paid';
      order.transactionId = paypalOrderId;
      order.status = 'processing';
      order.paidAt = Date.now();
      
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
        message: 'Payment successful',
        order
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Payment not completed'
      });
    }

  } catch (err) {
    console.error('❌ PayPal capture error:', err);
    res.status(500).json({
      success: false,
      error: 'Payment capture failed'
    });
  }
};