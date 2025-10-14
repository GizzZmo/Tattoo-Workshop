import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { setupAuthRoutes } from './auth/routes.js';
import { optionalAuth } from './auth/middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Initialize database
const db = new Database(join(__dirname, 'tattoo-workshop.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    artist_name TEXT NOT NULL,
    appointment_date DATETIME NOT NULL,
    duration INTEGER NOT NULL,
    status TEXT DEFAULT 'scheduled',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS pricelist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    duration INTEGER,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    artist_name TEXT,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS generated_tattoos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt TEXT NOT NULL,
    description TEXT,
    customer_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

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

// Setup authentication routes
setupAuthRoutes(app, db);

// Settings API
app.get('/api/settings/:key', (req, res) => {
  try {
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
    const result = stmt.get(req.params.key);
    res.json({ value: result?.value || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const { key, value } = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    stmt.run(key, value);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Gemini AI Tattoo Generator
app.post('/api/generate-tattoo', async (req, res) => {
  try {
    const { prompt, apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini API key not configured' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const enhancedPrompt = `As a professional tattoo artist, create a detailed description for a tattoo design based on this request: "${prompt}". Include: style (traditional, neo-traditional, realistic, etc.), placement suggestions, size recommendations, color scheme, and detailed artistic elements. Make it professional and suitable for a tattoo artist to work from.`;

    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const description = response.text();

    // Save to database
    const stmt = db.prepare('INSERT INTO generated_tattoos (prompt, description) VALUES (?, ?)');
    const info = stmt.run(prompt, description);

    res.json({ 
      success: true, 
      description,
      id: info.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Customers API
app.get('/api/customers', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM customers ORDER BY created_at DESC');
    const customers = stmt.all();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers', (req, res) => {
  try {
    const { name, email, phone, address, notes } = req.body;
    const stmt = db.prepare('INSERT INTO customers (name, email, phone, address, notes) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(name, email, phone, address, notes);
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/customers/:id', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM customers WHERE id = ?');
    const customer = stmt.get(req.params.id);
    if (customer) {
      res.json(customer);
    } else {
      res.status(404).json({ error: 'Customer not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/customers/:id', (req, res) => {
  try {
    const { name, email, phone, address, notes } = req.body;
    const stmt = db.prepare('UPDATE customers SET name = ?, email = ?, phone = ?, address = ?, notes = ? WHERE id = ?');
    stmt.run(name, email, phone, address, notes, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/customers/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM customers WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Appointments API
app.get('/api/appointments', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT a.*, c.name as customer_name, c.email as customer_email 
      FROM appointments a 
      JOIN customers c ON a.customer_id = c.id 
      ORDER BY a.appointment_date DESC
    `);
    const appointments = stmt.all();
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/appointments', (req, res) => {
  try {
    const { customer_id, artist_name, appointment_date, duration, notes } = req.body;
    const stmt = db.prepare('INSERT INTO appointments (customer_id, artist_name, appointment_date, duration, notes) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(customer_id, artist_name, appointment_date, duration, notes);
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/appointments/:id', (req, res) => {
  try {
    const { artist_name, appointment_date, duration, status, notes } = req.body;
    const stmt = db.prepare('UPDATE appointments SET artist_name = ?, appointment_date = ?, duration = ?, status = ?, notes = ? WHERE id = ?');
    stmt.run(artist_name, appointment_date, duration, status, notes, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/appointments/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM appointments WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pricelist API
app.get('/api/pricelist', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM pricelist ORDER BY category, service_name');
    const items = stmt.all();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/pricelist', (req, res) => {
  try {
    const { service_name, description, price, duration, category } = req.body;
    const stmt = db.prepare('INSERT INTO pricelist (service_name, description, price, duration, category) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(service_name, description, price, duration, category);
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/pricelist/:id', (req, res) => {
  try {
    const { service_name, description, price, duration, category } = req.body;
    const stmt = db.prepare('UPDATE pricelist SET service_name = ?, description = ?, price = ?, duration = ?, category = ? WHERE id = ?');
    stmt.run(service_name, description, price, duration, category, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/pricelist/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM pricelist WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Portfolio API
app.get('/api/portfolio', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM portfolio ORDER BY created_at DESC');
    const items = stmt.all();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/portfolio', (req, res) => {
  try {
    const { title, description, image_url, artist_name, tags } = req.body;
    const stmt = db.prepare('INSERT INTO portfolio (title, description, image_url, artist_name, tags) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(title, description, image_url, artist_name, tags);
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/portfolio/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM portfolio WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generated Tattoos API
app.get('/api/generated-tattoos', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM generated_tattoos ORDER BY created_at DESC LIMIT 50');
    const items = stmt.all();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
