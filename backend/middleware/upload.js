const multer = require('multer');
const path = require('path');
const fs = require('fs');

// uploads ফোল্ডার না থাকলে তৈরি করে নেওয়া
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// স্টোরেজ কনফিগারেশন
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // ফাইলের নামের সাথে টাইমস্ট্যাম্প যোগ করা যাতে নাম ডুপ্লিকেট না হয়
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// ফাইল টাইপ চেক (শুধু ইমেইজ অনুমোদিত)
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: শুধুমাত্র ইমেইজ ফাইল (JPG, PNG, WEBP) আপলোড করা যাবে!');
  }
}

const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB সাইজ লিমিট
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
});

module.exports = upload;