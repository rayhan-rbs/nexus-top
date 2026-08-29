/**
 * Game Controller — Game Management
 */

const Game = require('../models/Game');

// @desc    Get all active games (public)
// @route   GET /api/games
// @access  Public
exports.getAllGames = async (req, res) => {
  try {
    const games = await Game.find({ status: 'active' }).sort({ orderCount: -1 });
    
    res.json({
      success: true,
      count: games.length,
      games
    });
  } catch (err) {
    console.error('Get games error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch games'
    });
  }
};

// @desc    Get single game by ID (public)
// @route   GET /api/games/:id
// @access  Public
exports.getGameById = async (req, res) => {
  try {
    const game = await Game.findOne({ gameId: req.params.id });
    
    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }
    
    res.json({
      success: true,
      game
    });
  } catch (err) {
    console.error('Get game error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game'
    });
  }
};

// @desc    Get all games (admin - includes inactive)
// @route   GET /api/admin/games
// @access  Private/Admin
exports.getAllGamesAdmin = async (req, res) => {
  try {
    const games = await Game.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: games.length,
      games
    });
  } catch (err) {
    console.error('Get all games admin error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch games'
    });
  }
};

// @desc    Create new game (admin)
// @route   POST /api/admin/games
// @access  Private/Admin
exports.createGame = async (req, res) => {
  try {
    const gameData = { ...req.body };
    
    // 👈 যদি ইমেইজ আপলোড করা হয়, তবে তার পাথ সেভ করুন
    if (req.file) {
      gameData.image = `/uploads/${req.file.filename}`;
    }

    const existingGame = await Game.findOne({ gameId: gameData.gameId });
    if (existingGame) {
      return res.status(400).json({ success: false, error: 'Game with this ID already exists' });
    }
    
    const game = await Game.create(gameData);
    
    res.status(201).json({ success: true, message: 'Game created successfully', game });
  } catch (err) {
    console.error('Create game error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to create game' });
  }
};

// @desc    Update game (admin)
// @route   PUT /api/admin/games/:id
// @access  Private/Admin
exports.updateGame = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // 👈 নতুন ইমেইজ আপলোড করা হলে পুরানোটা রিপ্লেস হবে
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const game = await Game.findOneAndUpdate(
      { gameId: req.params.id },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }
    
    res.json({ success: true, message: 'Game updated successfully', game });
  } catch (err) {
    console.error('Update game error:', err);
    res.status(500).json({ success: false, error: 'Failed to update game' });
  }
};

// @desc    Delete game (admin)
// @route   DELETE /api/admin/games/:id
// @access  Private/Admin
exports.deleteGame = async (req, res) => {
  try {
    const game = await Game.findOneAndDelete({ gameId: req.params.id });
    
    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Game deleted successfully'
    });
  } catch (err) {
    console.error('Delete game error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete game'
    });
  }
};

// @desc    Add package to game (admin)
// @route   POST /api/admin/games/:id/packages
// @access  Private/Admin
exports.addPackage = async (req, res) => {
  try {
    const game = await Game.findOne({ gameId: req.params.id });
    
    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }
    
    const packageData = req.body;
    
    // Generate package ID if not provided
    if (!packageData.id) {
      packageData.id = 'pkg-' + Date.now();
    }
    
    game.packages.push(packageData);
    await game.save();
    
    res.json({
      success: true,
      message: 'Package added successfully',
      game
    });
  } catch (err) {
    console.error('Add package error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to add package'
    });
  }
};

// @desc    Update package (admin)
// @route   PUT /api/admin/games/:id/packages/:packageId
// @access  Private/Admin
exports.updatePackage = async (req, res) => {
  try {
    const game = await Game.findOne({ gameId: req.params.id });
    
    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }
    
    const packageIndex = game.packages.findIndex(p => p.id === req.params.packageId);
    
    if (packageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Package not found'
      });
    }
    
    game.packages[packageIndex] = { ...game.packages[packageIndex], ...req.body };
    await game.save();
    
    res.json({
      success: true,
      message: 'Package updated successfully',
      game
    });
  } catch (err) {
    console.error('Update package error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update package'
    });
  }
};

// @desc    Delete package (admin)
// @route   DELETE /api/admin/games/:id/packages/:packageId
// @access  Private/Admin
exports.deletePackage = async (req, res) => {
  try {
    const game = await Game.findOne({ gameId: req.params.id });
    
    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }
    
    game.packages = game.packages.filter(p => p.id !== req.params.packageId);
    await game.save();
    
    res.json({
      success: true,
      message: 'Package deleted successfully',
      game
    });
  } catch (err) {
    console.error('Delete package error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete package'
    });
  }
};