const paypal = require('@paypal/checkout-server-sdk');
const Order = require('../models/Order');
const User = require('../models/User');

// PayPal Environment সেটআপ
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }
  
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
    
    console.log('📥 Creating PayPal order for:', orderId);
    
    const order = await Order.findById(orderId)
      .populate('user', 'name email')
      .populate('game', 'title')
      .populate('package', 'amount');
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.user._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: Number(order.totalAmount || 0).toFixed(2),
          breakdown: {
            item_total: {
              currency_code: 'USD',
              value: Number(order.totalAmount || 0).toFixed(2)
            }
          }
        },
        description: `Gaming Top-up: ${order.game?.title || 'Game'}`,
        custom_id: order._id.toString()
      }],
      application_context: {
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders.html`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders.html`,
        brand_name: 'NexusTop Gaming',
        user_action: 'PAY_NOW'
      }
    });

    const response = await client().execute(request);
    console.log('✅ PayPal order created:', response.result.id);
    
    res.json({
      success: true,
      approveUrl: response.result.links.find(link => link.rel === 'approve').href,
      orderId: response.result.id
    });

  } catch (err) {
    console.error('❌ PayPal create order error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Capture PayPal Payment
// @route   POST /api/payments/paypal/capture
// @access  Private
exports.capturePayment = async (req, res) => {
  try {
    const { orderId, paypalOrderId } = req.body;
    console.log("🔵 [PAYPAL] Attempting to capture. DB Order ID:", orderId, "| PayPal Order ID:", paypalOrderId);

    // ১. ডাটাবেস থেকে অর্ডার খুঁজে বের করা
    const order = await Order.findById(orderId);
    if (!order) {
      console.error("❌ [PAYPAL] Order not found in DB for ID:", orderId);
      return res.status(404).json({ success: false, error: 'Order not found in database' });
    }

    // ২. PayPal API কল করে পেমেন্ট ক্যাপচার করা
    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({});
    const response = await client().execute(request);
    
    console.log("🟢 [PAYPAL] Capture Response Status:", response.result.status);

    if (response.result.status === 'COMPLETED') {
      
      // ৩. সঠিক Transaction ID (Capture ID) বের করা
      let actualTransactionId = paypalOrderId; // ফলব্যাক হিসেবে Order ID রাখা হলো
      
      try {
        // PayPal রেসপন্স থেকে নিরাপদে Capture ID নেওয়া
        const captures = response.result?.purchase_units?.[0]?.payments?.captures;
        if (captures && captures.length > 0) {
          actualTransactionId = captures[0].id;
          console.log("✅ [PAYPAL] Successfully extracted Capture ID:", actualTransactionId);
        } else {
          console.warn("⚠️ [PAYPAL] No captures array found, using Order ID as fallback");
        }
      } catch (extractErr) {
        console.error("❌ [PAYPAL] Error extracting Capture ID:", extractErr.message);
      }

      // ৪. MongoDB-তে ডেটা আপডেট করা
      console.log("💾 [MONGODB] Updating order with new payment data...");
      order.paymentMethod = 'paypal';
      order.paymentStatus = 'paid'; // ⚠️ এটি খুব জরুরি, নাহলে ফ্রন্টএন্ডে 'Pay Now' বাটন থেকে যাবে
      order.transactionId = actualTransactionId; // ✅ এখন এখানে সঠিক Sandbox TXN ID সেভ হবে
      order.status = 'processing'; // অথবা 'completed', আপনার বিজনেস লজিক অনুযায়ী
      order.paidAt = Date.now();

      // ডাটাবেসে সেভ করা
      await order.save();
      console.log("✅ [MONGODB] Order saved successfully to database!");

      // (ঐচ্ছিক) ইমেইল পাঠানোর লজিক এখানে থাকলে তা রাখতে পারেন

      return res.json({
        success: true,
        message: 'Payment successful and saved to database',
        order
      });

    } else {
      console.error("❌ [PAYPAL] Payment not completed. Status:", response.result.status);
      return res.status(400).json({
        success: false,
        error: 'Payment not completed. Status: ' + response.result.status
      });
    }

  } catch (err) {
    // ⚠️ যদি এখানে কোনো এরর প্রিন্ট হয়, তাহলেই বুঝবেন কেন MongoDB-তে সেভ হচ্ছে না
    console.error("❌❌❌ [CRITICAL ERROR] IN CAPTURE PAYMENT ❌❌❌");
    console.error("Error Message:", err.message);
    console.error("Full Error Object:", err);
    
    return res.status(500).json({
      success: false,
      error: err.message || 'Payment capture failed on server'
    });
  }
};