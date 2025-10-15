import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, testConnection } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeed() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Check if data already exists
    const userCheck = await query('SELECT COUNT(*) FROM users');
    if (parseInt(userCheck.rows[0].count) > 0) {
      console.log('⚠️  Database already contains data. Skipping seed.');
      return;
    }

    // Read and execute seed data
    const seedPath = path.join(__dirname, 'seed.sql');
    const seedData = fs.readFileSync(seedPath, 'utf8');
    
    console.log('📄 Executing seed data...');
    await query(seedData);
    
    console.log('✅ Database seeding completed successfully!');
    console.log('👥 Demo users created: admin/Admin123, student/student123');
    console.log('📚 Sample videos and progress data added');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed();
}

export default runSeed;
