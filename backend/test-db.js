const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log(`📍 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection Failed:', err.message);
    process.exit(1);
  }
}

testConnection();