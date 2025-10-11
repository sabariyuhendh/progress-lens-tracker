const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function fixAdminPassword() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Fixing admin password...');
    
    const client = await pool.connect();
    
    // Hash the password "Admin123"
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('Admin123', saltRounds);
    
    // Update the admin user password
    const result = await client.query(
      'UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING username, role',
      [passwordHash, 'admin']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Admin password updated successfully!');
      console.log(`👤 Username: ${result.rows[0].username}`);
      console.log(`🔑 Role: ${result.rows[0].role}`);
      console.log('🔐 Password: Admin123');
    } else {
      console.log('❌ Admin user not found');
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Failed to update admin password:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixAdminPassword();
