import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { setupAuthRoutes } from './auth/routes.js';
import EmailService from './email/service.js';
import EmailScheduler from './email/scheduler.js';
import { initializeTemplates } from './email/templates.js';
import RateLimit from 'express-rate-limit';
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

  CREATE TABLE IF NOT EXISTS email_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS email_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    appointment_id INTEGER,
    type TEXT NOT NULL,
    recipient TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
  );
`);

// Setup authentication routes
setupAuthRoutes(app, db);

// Initialize email templates and service
initializeTemplates(db);
const emailService = new EmailService(db);
const emailScheduler = new EmailScheduler(db);

// Start email scheduler (check every hour for reminders)
emailScheduler.start(60);

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

app.post('/api/appointments', async (req, res) => {
  try {
    const { customer_id, artist_name, appointment_date, duration, notes } = req.body;
    const stmt = db.prepare('INSERT INTO appointments (customer_id, artist_name, appointment_date, duration, notes) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(customer_id, artist_name, appointment_date, duration, notes);
    
    // Send confirmation email
    const customerStmt = db.prepare('SELECT * FROM customers WHERE id = ?');
    const customer = customerStmt.get(customer_id);
    
    if (customer) {
      const appointment = {
        id: info.lastInsertRowid,
        customer_id,
        artist_name,
        appointment_date,
        duration,
        notes,
      };
      
      // Send email asynchronously (don't wait for it)
      emailService.sendAppointmentConfirmation(appointment, customer).catch(err => {
        console.error('Failed to send confirmation email:', err);
      });
    }
    
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/appointments/:id', async (req, res) => {
  try {
    const { artist_name, appointment_date, duration, status, notes } = req.body;
    
    // Get the old appointment data for comparison
    const oldAppointmentStmt = db.prepare('SELECT * FROM appointments WHERE id = ?');
    const oldAppointment = oldAppointmentStmt.get(req.params.id);
    
    // Update the appointment
    const stmt = db.prepare('UPDATE appointments SET artist_name = ?, appointment_date = ?, duration = ?, status = ?, notes = ? WHERE id = ?');
    stmt.run(artist_name, appointment_date, duration, status, notes, req.params.id);
    
    // Get customer info
    const customerStmt = db.prepare('SELECT * FROM customers WHERE id = ?');
    const customer = customerStmt.get(oldAppointment.customer_id);
    
    if (customer) {
      const updatedAppointment = {
        id: req.params.id,
        customer_id: oldAppointment.customer_id,
        artist_name,
        appointment_date,
        duration,
        status,
        notes,
      };
      
      // Check if appointment was cancelled
      if (status === 'cancelled' && oldAppointment.status !== 'cancelled') {
        emailService.sendCancellationNotification(updatedAppointment, customer).catch(err => {
          console.error('Failed to send cancellation email:', err);
        });
      }
      // Check if appointment was rescheduled
      else if (appointment_date !== oldAppointment.appointment_date) {
        emailService.sendReschedulingNotification(updatedAppointment, customer, oldAppointment.appointment_date).catch(err => {
          console.error('Failed to send rescheduling email:', err);
        });
      }
    }
    
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

// Email Configuration API
app.get('/api/email/config', (req, res) => {
  try {
    const config = emailService.getEmailConfig();
    // Don't expose the password
    delete config.smtp_password;
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/email/config', (req, res) => {
  try {
    const { enabled, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password, from_address, from_name, reminders_enabled } = req.body;
    
    const settings = [
      { key: 'email_enabled', value: enabled },
      { key: 'email_smtp_host', value: smtp_host },
      { key: 'email_smtp_port', value: smtp_port },
      { key: 'email_smtp_secure', value: smtp_secure },
      { key: 'email_smtp_user', value: smtp_user },
      { key: 'email_from_address', value: from_address },
      { key: 'email_from_name', value: from_name },
      { key: 'email_reminders_enabled', value: reminders_enabled },
    ];
    
    // Only update password if it's provided
    if (smtp_password) {
      settings.push({ key: 'email_smtp_password', value: smtp_password });
    }
    
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    settings.forEach(setting => {
      if (setting.value !== undefined) {
        stmt.run(setting.key, String(setting.value));
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/email/test', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address required' });
    }
    
    const result = await emailService.sendTestEmail(email);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Email Templates API
const emailTemplatesLimiter = RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.get('/api/email/templates', emailTemplatesLimiter, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM email_templates ORDER BY name');
    const templates = stmt.all();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/email/templates/:name', (req, res) => {
  try {
    const template = emailService.getTemplate(req.params.name);
    if (template) {
      res.json(template);
    } else {
      res.status(404).json({ error: 'Template not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/email/templates/:name', (req, res) => {
  try {
    const { subject, body } = req.body;
    const stmt = db.prepare('UPDATE email_templates SET subject = ?, body = ?, updated_at = datetime("now") WHERE name = ?');
    stmt.run(subject, body, req.params.name);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Email Notifications Log API
app.get('/api/email/notifications', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT en.*, c.name as customer_name, c.email as customer_email
      FROM email_notifications en
      JOIN customers c ON en.customer_id = c.id
      ORDER BY en.created_at DESC
      LIMIT 100
    `);
    const notifications = stmt.all();
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
