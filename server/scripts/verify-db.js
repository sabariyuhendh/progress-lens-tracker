const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function verifyDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Verifying database setup...');
    
    const client = await pool.connect();
    
    // Check if tables exist
    console.log('\n📋 Checking tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('Tables found:', tablesResult.rows.map(r => r.table_name));
    
    // Check users
    console.log('\n👥 Checking users...');
    const usersResult = await client.query('SELECT * FROM users ORDER BY id');
    console.log(`Found ${usersResult.rows.length} users:`);
    usersResult.rows.forEach(user => {
      console.log(`  - ID: ${user.id}, Username: ${user.username}, Role: ${user.role}, Created: ${user.created_at}`);
    });
    
    // Check videos
    console.log('\n📹 Checking videos...');
    const videosResult = await client.query('SELECT COUNT(*) as count FROM videos');
    console.log(`Found ${videosResult.rows[0].count} videos`);
    
    // Check user progress
    console.log('\n📊 Checking user progress...');
    const progressResult = await client.query('SELECT COUNT(*) as count FROM user_progress');
    console.log(`Found ${progressResult.rows[0].count} progress records`);
    
    // Test admin login
    console.log('\n🔐 Testing admin login...');
    const adminUser = await client.query('SELECT * FROM users WHERE username = $1', ['admin']);
    if (adminUser.rows.length > 0) {
      const user = adminUser.rows[0];
      const passwordMatch = await bcrypt.compare('Admin123', user.password_hash);
      console.log(`Admin password test: ${passwordMatch ? '✅ VALID' : '❌ INVALID'}`);
    } else {
      console.log('❌ Admin user not found!');
    }
    
    client.release();
    console.log('\n✅ Database verification completed!');
    
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

verifyDatabase();
