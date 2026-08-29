const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload'); // 👈 এই লাইনটি যোগ করুন
const {
  getAllGames,
  getGameById,
  getAllGamesAdmin,
  createGame,
  updateGame,
  deleteGame,
  addPackage,
  updatePackage,
  deletePackage
} = require('../controllers/gameController');

// Public routes
router.get('/', getAllGames);
router.get('/:id', getGameById);

// Admin routes (👈 upload.single('image') যোগ করা হয়েছে)
router.get('/admin/all', protect, authorize('admin'), getAllGamesAdmin);
router.post('/admin', protect, authorize('admin'), upload.single('image'), createGame);
router.put('/admin/:id', protect, authorize('admin'), upload.single('image'), updateGame);
router.delete('/admin/:id', protect, authorize('admin'), deleteGame);

// Package management
router.post('/admin/:id/packages', protect, authorize('admin'), addPackage);
router.put('/admin/:id/packages/:packageId', protect, authorize('admin'), updatePackage);
router.delete('/admin/:id/packages/:packageId', protect, authorize('admin'), deletePackage);

module.exports = router;