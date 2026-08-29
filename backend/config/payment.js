/**
 * Payment Configuration
 */

module.exports = {
  // PayPal Configuration (Sandbox for testing)
  paypal: {
    mode: 'sandbox', // 'sandbox' for testing, 'live' for production
    clientId: process.env.PAYPAL_CLIENT_ID || 'YOUR_PAYPAL_CLIENT_ID',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || 'YOUR_PAYPAL_CLIENT_SECRET'
  },

  // Manual Payment Numbers (আপনার পার্সোনাল নম্বর)
  manual: {
    bkash: {
      number: '01712345678', // আপনার bKash নম্বর দিন
      type: 'Personal'
    },
    nagad: {
      number: '01812345678', // আপনার Nagad নম্বর দিন
      type: 'Personal'
    },
    rocket: {
      number: '01912345678', // আপনার Rocket নম্বর দিন
      type: 'Personal'
    }
  },

  // Demo Payment (টেস্টিং এর জন্য)
  demo: {
    enabled: true, // প্রোডাকশনে false করে দেবেন
    message: 'Demo Mode - No real payment required'
  }
};