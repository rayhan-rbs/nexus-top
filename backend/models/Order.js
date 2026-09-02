const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // ১. ইউজার রেফারেন্স (কে অর্ডার করল)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ২. গেমের তথ্য
  game: {
    id: { type: String, required: true },
    title: { type: String, required: true },
    icon: { type: String, required: true },
    currency: { type: String, required: true }
  },

  // ৩. প্যাকেজের তথ্য
  package: {
    id: { type: String, required: true },
    amount: { type: String, required: true },
    bonus: { type: String },
    price: { type: Number, required: true },
    oldPrice: { type: Number }
  },

  // ৪. ইউজারের গেম আইডি (যেমন: PUBG ID)
  gameId: {
    type: String,
    required: [true, 'Game ID is required']
  },

  // ৫. অটোমেটিক অর্ডার আইডি জেনারেশন (এটাই ম্যাজিক!)
  orderId: {
    type: String,
    unique: true,
    default: function() {
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `NXT-${timestamp}-${random}`; // উদাহরণ: NXT-M5X9Y2-A7B3C1
    }
  },

  // ৬. অর্ডার স্ট্যাটাস
  status: {
    type: String,
    enum: ['pending','pending_verification', 'processing', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },

  // ৭. পেমেন্ট মেথড
  paymentMethod: {
    type: String,
    enum: ['bkash', 'nagad', 'rocket', 'card', 'manual', 'demo', 'paypal'],
    default: 'manual'
  },

  // ৮. পেমেন্ট স্ট্যাটাস
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'pending_verification', 'failed', 'refunded', 'completed'],
    default: 'unpaid'
  },

  transactionId: String,

  // ৯. মোট টাকা
  totalAmount: {
    type: Number,
    required: true
  },

  // ১০. অতিরিক্ত নোট
  note: String,

  // ১১. ডেলিভারি বা ক্যান্সেলের সময়
  deliveredAt: Date,
  cancelledAt: Date,
  cancelledReason: String

}, {
  timestamps: true // এটি অটোমেটিক createdAt এবং updatedAt ফিল্ড যোগ করবে
});

// তারিখ সুন্দরভাবে দেখানোর জন্য ভার্চুয়াল ফিল্ড
orderSchema.virtual('formattedDate').get(function() {
  return new Date(this.createdAt).toLocaleString('bn-BD');
});

// JSON রেসপন্সে ভার্চুয়াল ফিল্ড দেখানোর জন্য
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);