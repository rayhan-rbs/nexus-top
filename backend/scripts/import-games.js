/**
 * Import Games from JSON to MongoDB
 * Run: node scripts/import-games.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Game = require('../models/Game');

async function importGames() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Read games.json
    const gamesJsonPath = path.join(__dirname, '../../frontend/data/games.json');
    const gamesData = JSON.parse(fs.readFileSync(gamesJsonPath, 'utf8'));

    console.log(`📦 Found ${gamesData.games.length} games to import`);

    // Clear existing games (optional - comment out if you want to keep existing)
    // await Game.deleteMany({});
    // console.log('🗑️ Cleared existing games');

    // Import games
    let imported = 0;
    let skipped = 0;

    for (const game of gamesData.games) {
      // Check if game already exists
      const existingGame = await Game.findOne({ gameId: game.id });
      
      if (existingGame) {
        console.log(`⏭️  Skipped: ${game.title} (already exists)`);
        skipped++;
        continue;
      }

      // Create game
      await Game.create({
        gameId: game.id,
        title: game.title,
        tag: game.tag,
        category: game.category,
        icon: game.icon,
        color: game.color,
        description: game.description,
        currency: game.currency,
        rating: game.rating,
        players: game.players,
        status: game.status || 'active',
        packages: game.packages.map(pkg => ({
          id: pkg.id,
          amount: pkg.amount,
          bonus: pkg.bonus,
          price: pkg.price,
          oldPrice: pkg.oldPrice,
          popular: pkg.popular || false
        }))
      });

      console.log(`✅ Imported: ${game.title}`);
      imported++;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🎉 Import completed!`);
    console.log(`✅ Imported: ${imported} games`);
    console.log(`⏭️  Skipped: ${skipped} games`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (err) {
    console.error('❌ Import error:', err.message);
    process.exit(1);
  }
}

importGames();