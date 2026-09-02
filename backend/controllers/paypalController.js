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
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({});
    
    const response = await client().execute(request);
    
    if (response.result.status === 'COMPLETED') {
      // ✅ SAFE EXTRACTION: সার্ভার ক্র্যাশ প্রতিরোধ করতে নিরাপদ উপায়
      let actualTransactionId = paypalOrderId; // ডিফল্ট হিসেবে paypalOrderId রাখা হলো
      
      try {
        const captures = response.result?.purchase_units?.[0]?.payments?.captures;
        if (captures && captures.length > 0) {
          actualTransactionId = captures[0].id;
        }
      } catch (extractErr) {
        console.warn("⚠️ Could not extract deep transaction ID, using fallback:", extractErr.message);
      }

      // অর্ডার আপডেট করা
      order.paymentMethod = 'paypal';
      order.paymentStatus = 'paid';
      order.transactionId = actualTransactionId; // ✅ নিরাপদ ID সেভ হচ্ছে
      order.status = 'processing';
      order.paidAt = Date.now();
      
      await order.save();

      // ইমেইল পাঠানো (ঐচ্ছিক)
      try {
        const { sendPaymentSuccess } = require('../utils/emailService');
        const User = require('../models/User');
        const user = await User.findById(order.user);
        if (user) {
          sendPaymentSuccess(user, order);
        }
      } catch (err) {
        console.error('❌ Email send failed (non-critical):', err.message);
      }

      res.json({
        success: true,
        message: 'Payment successful',
        order
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Payment not completed. Status: ' + response.result.status
      });
    }

  } catch (err) {
    console.error("❌ BACKEND PAYPAL CAPTURE ERROR:", err);
    res.status(500).json({
      success: false,
      error: err.message || 'Payment capture failed on server'
    });
  }
};