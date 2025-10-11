const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Connecting to database...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Running database schema...');
    await client.query(schema);
    console.log('✅ Database schema applied successfully!');
    
    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check if admin user was created
    const adminResult = await client.query('SELECT username, role FROM users WHERE role = $1', ['admin']);
    if (adminResult.rows.length > 0) {
      console.log('\n👤 Admin user created:');
      console.log(`  - Username: ${adminResult.rows[0].username}`);
      console.log(`  - Role: ${adminResult.rows[0].role}`);
      console.log('  - Password: Admin123');
    }
    
    // Check initial videos count
    const videosResult = await client.query('SELECT COUNT(*) as count FROM videos');
    console.log(`\n📹 Videos in database: ${videosResult.rows[0].count}`);
    
    client.release();
    console.log('\n🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
