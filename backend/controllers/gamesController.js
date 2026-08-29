/**
 * Games Controller — Business Logic
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/games.json');

// Helper: Read data file
function readData() {
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(data);
}

// Helper: Write data file
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET all games
exports.getAllGames = (req, res) => {
  try {
    const data = readData();
    res.json(data);
  } catch (err) {
    console.error('Error reading games:', err);
    res.status(500).json({ error: 'Failed to load games' });
  }
};

// GET single game
exports.getGameById = (req, res) => {
  try {
    const data = readData();
    const game = data.games.find(g => g.id === req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (err) {
    console.error('Error reading game:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST add game (admin)
exports.addGame = (req, res) => {
  try {
    const data = readData();
    const newGame = req.body;
    
    // Validate
    if (!newGame.id || !newGame.title) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if exists
    if (data.games.find(g => g.id === newGame.id)) {
      return res.status(400).json({ error: 'Game ID already exists' });
    }
    
    data.games.push(newGame);
    writeData(data);
    
    res.status(201).json({ success: true, game: newGame });
  } catch (err) {
    console.error('Error adding game:', err);
    res.status(500).json({ error: 'Failed to add game' });
  }
};

// PUT update game (admin)
exports.updateGame = (req, res) => {
  try {
    const data = readData();
    const idx = data.games.findIndex(g => g.id === req.params.id);
    
    if (idx === -1) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    data.games[idx] = { ...data.games[idx], ...req.body };
    writeData(data);
    
    res.json({ success: true, game: data.games[idx] });
  } catch (err) {
    console.error('Error updating game:', err);
    res.status(500).json({ error: 'Failed to update game' });
  }
};

// DELETE game (admin)
exports.deleteGame = (req, res) => {
  try {
    const data = readData();
    const idx = data.games.findIndex(g => g.id === req.params.id);
    
    if (idx === -1) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const deleted = data.games.splice(idx, 1);
    writeData(data);
    
    res.json({ success: true, deleted: deleted[0] });
  } catch (err) {
    console.error('Error deleting game:', err);
    res.status(500).json({ error: 'Failed to delete game' });
  }
};