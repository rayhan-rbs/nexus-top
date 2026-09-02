const Order = require('../models/Order');

// PayPal থেকে Access Token নেওয়া
async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  
  const baseUrl = process.env.PAYPAL_MODE === 'sandbox' 
    ? 'https://api-m.sandbox.paypal.com' 
    : 'https://api-m.paypal.com';

  const auth = Buffer.from(clientId + ':' + secret).toString('base64');

  const response = await fetch(baseUrl + '/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + auth,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  
  if (!data.access_token) {
    throw new Error('Failed to get PayPal access token: ' + (data.error_description || 'Unknown error'));
  }
  
  return data.access_token;
}

// @desc    Create PayPal Order
// @route   POST /api/payments/paypal/create-order
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    console.log("📥 PayPal createOrder request for orderId:", req.body.orderId);
    
    const { orderId } = req.body;
    
    const order = await Order.findById(orderId).populate('user', 'name email');
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.user._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    // PayPal credentials check
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      console.error("❌ PayPal credentials missing!");
      return res.status(500).json({ success: false, error: 'PayPal not configured on server' });
    }

    const baseUrl = process.env.PAYPAL_MODE === 'sandbox' 
      ? 'https://api-m.sandbox.paypal.com' 
      : 'https://api-m.paypal.com';

    // Access Token নেওয়া
    const accessToken = await getPayPalAccessToken();
    console.log("✅ PayPal access token received");

    // Order তৈরি করা
    const totalAmount = Number(order.totalAmount);
    
    const response = await fetch(baseUrl + '/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: totalAmount.toFixed(2)
          },
          description: 'Gaming Top-up: ' + order.game.title + ' - ' + order.package.amount + ' ' + order.game.currency,
          custom_id: order._id.toString()
        }]
      })
    });

    const data = await response.json();
    console.log("✅ PayPal order created:", data.id);
    
    res.json({
      success: true,
      orderId: data.id,
      approveUrl: data.links ? data.links.find(link => link.rel === 'approve').href : null
    });

  } catch (err) {
    console.error("❌ PAYPAL CREATE ORDER ERROR:", err.message);
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
    
    console.log("📥 Capturing PayPal payment for order:", orderId, "paypalOrderId:", paypalOrderId);
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const baseUrl = process.env.PAYPAL_MODE === 'sandbox' 
      ? 'https://api-m.sandbox.paypal.com' 
      : 'https://api-m.paypal.com';

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(baseUrl + '/v2/checkout/orders/' + paypalOrderId + '/capture', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.status === 'COMPLETED') {
      order.paymentMethod = 'paypal';
      order.paymentStatus = 'paid';
      order.transactionId = paypalOrderId;
      order.status = 'COMPLETED';
      order.paidAt = Date.now();
      
      await order.save();
      console.log("✅ Payment captured and order updated");

      // Send email (non-critical)
      try {
        const { sendPaymentSuccess } = require('../utils/emailService');
        const User = require('../models/User');
        const user = await User.findById(order.user);
        if (user) {
          sendPaymentSuccess(user, order);
        }
      } catch (emailErr) {
        console.error('Email send failed (non-critical):', emailErr.message);
      }

      res.json({
        success: true,
        message: 'Payment successful',
        order
      });
    } else {
      console.error("❌ Payment not completed. Status:", data.status);
      res.status(400).json({
        success: false,
        error: 'Payment not completed. Status: ' + data.status
      });
    }

  } catch (err) {
    console.error("❌ PAYPAL CAPTURE ERROR:", err.message);
    res.status(500).json({
      success: false,
      error: err.message || 'Payment capture failed'
    });
  }
};