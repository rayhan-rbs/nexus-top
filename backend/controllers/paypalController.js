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
    
    console.log('📥 Capturing payment for order:', orderId, 'PayPal Order:', paypalOrderId);
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      console.error('❌ Order not found:', orderId);
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({});
    
    const response = await client().execute(request);
    
    console.log('📊 PayPal response status:', response.result.status);
    
    if (response.result.status === 'COMPLETED') {
      // ✅ নিরাপদভাবে Transaction ID বের করা
      let actualTransactionId = paypalOrderId; 
      try {
        if (response.result.purchase_units && 
            response.result.purchase_units[0] &&
            response.result.purchase_units[0].payments && 
            response.result.purchase_units[0].payments.captures &&
            response.result.purchase_units[0].payments.captures[0]) {
          actualTransactionId = response.result.purchase_units[0].payments.captures[0].id;
          console.log('✅ Extracted Transaction ID:', actualTransactionId);
        }
      } catch (extractErr) {
        console.warn('⚠️ Could not extract transaction ID:', extractErr.message);
      }

      // অর্ডার আপডেট করা
      order.paymentMethod = 'paypal';
      order.paymentStatus = 'paid';
      order.transactionId = actualTransactionId;
      order.status = 'processing';
      order.paidAt = Date.now();
      
      await order.save();
      console.log('✅ Order updated in database');

      res.json({
        success: true,
        message: 'Payment successful',
        order
      });
    } else {
      console.error('❌ Payment not completed. Status:', response.result.status);
      res.status(400).json({
        success: false,
        error: 'Payment not completed. Status: ' + response.result.status
      });
    }

  } catch (err) {
    console.error('❌ BACKEND PAYPAL CAPTURE ERROR:', err.message);
    console.error('❌ Full error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Payment capture failed'
    });
  }
};