import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import Database from 'better-sqlite3';
import { setupAuthRoutes } from './routes.js';
import bcrypt from 'bcryptjs';

describe('Auth Routes - Login', () => {
  let app;
  let db;

  beforeEach(async () => {
    app = express();
    app.use(express.json());

    db = new Database(':memory:');
    
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

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('TestPass123!', salt);
    
    const stmt = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, status)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run('Test User', 'test@example.com', passwordHash, 'admin', 'active');
    stmt.run('Inactive User', 'inactive@example.com', passwordHash, 'admin', 'inactive');
    // Using a different email for rate limiting to avoid interference from other tests
    stmt.run('Rate Limit User', 'ratelimit@example.com', passwordHash, 'admin', 'active');

    setupAuthRoutes(app, db);
  });

  afterEach(() => {
    db.close();
  });

  it('should login successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'TestPass123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('should fail with invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('should fail with non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nobody@example.com',
        password: 'TestPass123!'
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('should fail if account is not active', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'inactive@example.com',
        password: 'TestPass123!'
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Account is not active');
  });

  it('should enforce rate limiting', async () => {
    // 5 failed attempts will reach the limit (MAX_ATTEMPTS = 5)
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ratelimit@example.com',
          password: 'wrongpassword'
        });
    }

    // 6th attempt should be blocked, and we expect the 'Account locked' message since it was locked on the 5th failed attempt or 6th
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'ratelimit@example.com',
        password: 'TestPass123!'
      });

    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/Account locked/);
  });
});
