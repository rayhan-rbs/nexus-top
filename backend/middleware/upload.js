const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cloudinary কনফিগারেশন
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary Storage সেটআপ
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nexustop-games', // Cloudinary-তে একটি ফোল্ডার তৈরি করবে
    allowed_formats: ['jpeg', 'png', 'jpg', 'webp'],
    // ফাইলের নাম ইউনিক রাখার জন্য
    public_id: (req, file) => 'game-' + Date.now() + '-' + Math.round(Math.random() * 1E9)
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB লিমিট
});

module.exports = upload;