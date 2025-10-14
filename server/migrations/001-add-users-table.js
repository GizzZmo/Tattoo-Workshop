/**
 * Database Migration: Add Users Table
 * Run this to add user authentication support to the database
 * 
 * Usage: node server/migrations/001-add-users-table.js
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '../tattoo-workshop.db'));

console.log('🔄 Running migration: Add users table...\n');

async function runMigration() {
  try {
    // Create users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'artist', 'receptionist')) DEFAULT 'receptionist',
        status TEXT NOT NULL CHECK(status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
        phone TEXT,
        bio TEXT,
        avatar_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      );
    `);
    
    console.log('✅ Users table created successfully');
    
    // Check if any users exist
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    
    if (userCount.count === 0) {
      console.log('\n📝 Creating default admin user...');
      
      // Create default admin user (password: Admin123)
      const defaultPassword = 'Admin123';
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(defaultPassword, salt);
      
      const stmt = db.prepare(`
        INSERT INTO users (name, email, password_hash, role, status)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run('Admin User', 'admin@tattoo-workshop.local', passwordHash, 'admin', 'active');
      
      console.log('✅ Default admin user created');
      console.log('   Email: admin@tattoo-workshop.local');
      console.log('   Password: Admin123');
      console.log('   ⚠️  IMPORTANT: Change this password immediately after first login!\n');
    } else {
      console.log(`\n✅ Found ${userCount.count} existing user(s)`);
    }
    
    db.close();
    console.log('✨ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    db.close();
    process.exit(1);
  }
}

runMigration();
