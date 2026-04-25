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

// Rate limiter for sensitive admin/config routes
const configLimiter = RateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit to 5 requests per minute per IP
  message: "Too many configuration changes from this IP, please try again later."
});
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

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    appointment_id INTEGER,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'partial', 'paid', 'cancelled')),
    subtotal REAL NOT NULL DEFAULT 0,
    tax_rate REAL NOT NULL DEFAULT 0,
    tax_amount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    deposit_amount REAL NOT NULL DEFAULT 0,
    amount_paid REAL NOT NULL DEFAULT 0,
    notes TEXT,
    due_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
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

app.post('/api/email/config', configLimiter, (req, res) => {
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

// Rate limiter for invoice API routes
const invoiceLimiter = RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: 'Too many requests from this IP, please try again later.',
});

// Helper: generate next invoice number
function generateInvoiceNumber(db) {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'invoice_counter'").get();
  const counter = row ? parseInt(row.value, 10) + 1 : 1;
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('invoice_counter', ?)").run(String(counter));
  return `INV-${String(counter).padStart(5, '0')}`;
}

// Helper: recalculate invoice totals from items
function recalculateInvoiceTotals(db, invoiceId) {
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(invoiceId);
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const invoice = db.prepare('SELECT tax_rate, amount_paid, deposit_amount FROM invoices WHERE id = ?').get(invoiceId);
  if (!invoice) return;
  const taxAmount = subtotal * (invoice.tax_rate / 100);
  const total = subtotal + taxAmount;
  const amountPaid = invoice.amount_paid;
  let status = 'pending';
  if (amountPaid >= total && total > 0) status = 'paid';
  else if (amountPaid > 0) status = 'partial';
  db.prepare(
    'UPDATE invoices SET subtotal = ?, tax_amount = ?, total = ?, status = ?, updated_at = datetime("now") WHERE id = ?'
  ).run(subtotal, taxAmount, total, status, invoiceId);
}

// Invoices API
app.get('/api/invoices', invoiceLimiter, (req, res) => {
  try {
    const invoices = db.prepare(`
      SELECT i.*, c.name as customer_name, c.email as customer_email
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      ORDER BY i.created_at DESC
    `).all();
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/invoices/:id', invoiceLimiter, (req, res) => {
  try {
    const invoice = db.prepare(`
      SELECT i.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone, c.address as customer_address
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `).get(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id').all(req.params.id);
    res.json({ ...invoice, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/invoices', invoiceLimiter, (req, res) => {
  try {
    const { customer_id, appointment_id, tax_rate, deposit_amount, amount_paid, notes, due_date, items } = req.body;
    const invoiceNumber = generateInvoiceNumber(db);
    const initialAmountPaid = amount_paid !== undefined ? Number(amount_paid) : 0;
    const info = db.prepare(
      'INSERT INTO invoices (invoice_number, customer_id, appointment_id, tax_rate, deposit_amount, amount_paid, notes, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(invoiceNumber, customer_id, appointment_id || null, tax_rate || 0, deposit_amount || 0, initialAmountPaid, notes || null, due_date || null);
    const invoiceId = info.lastInsertRowid;
    if (Array.isArray(items)) {
      const insertItem = db.prepare('INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?)');
      for (const item of items) {
        const total = (item.quantity || 1) * (item.unit_price || 0);
        insertItem.run(invoiceId, item.description, item.quantity || 1, item.unit_price || 0, total);
      }
    }
    recalculateInvoiceTotals(db, invoiceId);
    res.json({ success: true, id: invoiceId, invoice_number: invoiceNumber });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/invoices/:id', invoiceLimiter, (req, res) => {
  try {
    const { tax_rate, deposit_amount, amount_paid, notes, due_date, status } = req.body;
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    const newAmountPaid = amount_paid !== undefined ? amount_paid : invoice.amount_paid;
    const newTotal = invoice.total;
    let newStatus = status;
    if (!newStatus) {
      if (newAmountPaid >= newTotal && newTotal > 0) newStatus = 'paid';
      else if (newAmountPaid > 0) newStatus = 'partial';
      else newStatus = 'pending';
    }
    db.prepare(
      'UPDATE invoices SET tax_rate = ?, deposit_amount = ?, amount_paid = ?, notes = ?, due_date = ?, status = ?, updated_at = datetime("now") WHERE id = ?'
    ).run(tax_rate !== undefined ? tax_rate : invoice.tax_rate, deposit_amount !== undefined ? deposit_amount : invoice.deposit_amount, newAmountPaid, notes !== undefined ? notes : invoice.notes, due_date !== undefined ? due_date : invoice.due_date, newStatus, req.params.id);
    recalculateInvoiceTotals(db, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/invoices/:id', invoiceLimiter, (req, res) => {
  try {
    db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(req.params.id);
    db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Invoice items
app.post('/api/invoices/:id/items', invoiceLimiter, (req, res) => {
  try {
    const { description, quantity, unit_price } = req.body;
    const total = (quantity || 1) * (unit_price || 0);
    const info = db.prepare('INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?)').run(req.params.id, description, quantity || 1, unit_price || 0, total);
    recalculateInvoiceTotals(db, req.params.id);
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/invoices/:id/items/:itemId', invoiceLimiter, (req, res) => {
  try {
    const { description, quantity, unit_price } = req.body;
    const total = (quantity || 1) * (unit_price || 0);
    db.prepare('UPDATE invoice_items SET description = ?, quantity = ?, unit_price = ?, total = ? WHERE id = ? AND invoice_id = ?').run(description, quantity || 1, unit_price || 0, total, req.params.itemId, req.params.id);
    recalculateInvoiceTotals(db, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/invoices/:id/items/:itemId', invoiceLimiter, (req, res) => {
  try {
    db.prepare('DELETE FROM invoice_items WHERE id = ? AND invoice_id = ?').run(req.params.itemId, req.params.id);
    recalculateInvoiceTotals(db, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create invoice from appointment
app.post('/api/invoices/from-appointment/:appointmentId', invoiceLimiter, (req, res) => {
  try {
    const appointment = db.prepare(`
      SELECT a.*, c.name as customer_name
      FROM appointments a JOIN customers c ON a.customer_id = c.id
      WHERE a.id = ?
    `).get(req.params.appointmentId);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    const invoiceNumber = generateInvoiceNumber(db);
    const info = db.prepare(
      // columns: invoice_number, customer_id, appointment_id, tax_rate, deposit_amount, amount_paid, notes
      'INSERT INTO invoices (invoice_number, customer_id, appointment_id, tax_rate, deposit_amount, amount_paid, notes) VALUES (?, ?, ?, 0, 0, 0, ?)'
    ).run(invoiceNumber, appointment.customer_id, appointment.id, `Invoice for appointment with ${appointment.artist_name}`);
    const invoiceId = info.lastInsertRowid;
    // Add a default line item for the appointment
    db.prepare('INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total) VALUES (?, ?, 1, 0, 0)').run(
      invoiceId, `Tattoo appointment with ${appointment.artist_name} (${new Date(appointment.appointment_date).toLocaleDateString()})`
    );
    recalculateInvoiceTotals(db, invoiceId);
    res.json({ success: true, id: invoiceId, invoice_number: invoiceNumber });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics API
app.get('/api/analytics', (req, res) => {
  try {
    const totalRevenue = db.prepare(
      "SELECT COALESCE(SUM(amount_paid), 0) as total FROM invoices WHERE status IN ('paid', 'partial')"
    ).get();

    const outstandingBalance = db.prepare(
      "SELECT COALESCE(SUM(total - amount_paid), 0) as total FROM invoices WHERE status NOT IN ('paid', 'cancelled')"
    ).get();

    const appointmentStats = db.prepare(
      "SELECT status, COUNT(*) as count FROM appointments GROUP BY status"
    ).all();

    const monthlyRevenue = db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month,
             COALESCE(SUM(amount_paid), 0) as revenue
      FROM invoices
      WHERE status IN ('paid', 'partial')
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6
    `).all();

    const topServices = db.prepare(`
      SELECT ii.description, SUM(ii.total) as total, COUNT(*) as count
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      WHERE i.status IN ('paid', 'partial')
      GROUP BY ii.description
      ORDER BY total DESC
      LIMIT 5
    `).all();

    const recentAppointments = db.prepare(`
      SELECT a.appointment_date, a.status, a.artist_name, c.name as customer_name
      FROM appointments a
      JOIN customers c ON a.customer_id = c.id
      ORDER BY a.appointment_date DESC
      LIMIT 5
    `).all();

    res.json({
      totalRevenue: totalRevenue.total,
      outstandingBalance: outstandingBalance.total,
      appointmentStats,
      monthlyRevenue,
      topServices,
      recentAppointments,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
