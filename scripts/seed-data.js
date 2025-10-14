/**
 * Sample Data Seeding Script
 * Run this to populate your database with sample data for testing
 * 
 * Usage: node scripts/seed-data.js
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '../server/tattoo-workshop.db'));

console.log('🌱 Seeding database with sample data...\n');

// Create tables if they don't exist
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
`);

console.log('✅ Database tables ready\n');

// Sample Customers
const customers = [
  {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    phone: '555-0101',
    address: '123 Main St, New York, NY 10001',
    notes: 'Regular customer, prefers traditional style'
  },
  {
    name: 'Bob Smith',
    email: 'bob@example.com',
    phone: '555-0102',
    address: '456 Oak Ave, Los Angeles, CA 90001',
    notes: 'First-time customer, interested in sleeve'
  },
  {
    name: 'Carol Martinez',
    email: 'carol@example.com',
    phone: '555-0103',
    address: '789 Pine Rd, Chicago, IL 60601',
    notes: 'Prefers color work, multiple sessions'
  },
  {
    name: 'David Lee',
    email: 'david@example.com',
    phone: '555-0104',
    address: '321 Elm St, Houston, TX 77001',
    notes: 'Looking for memorial tattoo'
  }
];

const customerStmt = db.prepare(
  'INSERT INTO customers (name, email, phone, address, notes) VALUES (?, ?, ?, ?, ?)'
);

customers.forEach(customer => {
  customerStmt.run(
    customer.name,
    customer.email,
    customer.phone,
    customer.address,
    customer.notes
  );
});

console.log(`✅ Added ${customers.length} customers`);

// Sample Pricelist
const services = [
  {
    service_name: 'Small Tattoo (up to 2")',
    description: 'Simple designs, minimal detail',
    price: 80,
    duration: 60,
    category: 'Small Tattoos'
  },
  {
    service_name: 'Medium Tattoo (2-5")',
    description: 'Moderate detail and size',
    price: 150,
    duration: 120,
    category: 'Medium Tattoos'
  },
  {
    service_name: 'Large Tattoo (5-10")',
    description: 'Complex designs with high detail',
    price: 300,
    duration: 180,
    category: 'Large Tattoos'
  },
  {
    service_name: 'Full Sleeve',
    description: 'Complete arm coverage, multiple sessions',
    price: 2000,
    duration: 600,
    category: 'Large Tattoos'
  },
  {
    service_name: 'Touch-up (within 1 year)',
    description: 'Free touch-up for existing tattoos',
    price: 0,
    duration: 30,
    category: 'Touch-ups'
  },
  {
    service_name: 'Touch-up (after 1 year)',
    description: 'Touch-up for older tattoos',
    price: 50,
    duration: 45,
    category: 'Touch-ups'
  },
  {
    service_name: 'Cover-up Consultation',
    description: 'Assessment and planning for cover-up work',
    price: 50,
    duration: 30,
    category: 'Consultations'
  },
  {
    service_name: 'Custom Design Session',
    description: 'Work with artist to create custom design',
    price: 100,
    duration: 60,
    category: 'Consultations'
  }
];

const serviceStmt = db.prepare(
  'INSERT INTO pricelist (service_name, description, price, duration, category) VALUES (?, ?, ?, ?, ?)'
);

services.forEach(service => {
  serviceStmt.run(
    service.service_name,
    service.description,
    service.price,
    service.duration,
    service.category
  );
});

console.log(`✅ Added ${services.length} services to pricelist`);

// Sample Appointments
const appointments = [
  {
    customer_id: 1,
    artist_name: 'Sarah Chen',
    appointment_date: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
    duration: 120,
    status: 'scheduled',
    notes: 'Traditional rose design on shoulder'
  },
  {
    customer_id: 2,
    artist_name: 'Mike Rodriguez',
    appointment_date: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
    duration: 180,
    status: 'scheduled',
    notes: 'Starting sleeve - Japanese dragon'
  },
  {
    customer_id: 3,
    artist_name: 'Sarah Chen',
    appointment_date: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
    duration: 150,
    status: 'completed',
    notes: 'Watercolor butterfly - completed successfully'
  },
  {
    customer_id: 4,
    artist_name: 'Alex Thompson',
    appointment_date: new Date(Date.now() + 86400000 * 10).toISOString(), // 10 days from now
    duration: 90,
    status: 'scheduled',
    notes: 'Memorial portrait consultation and first session'
  }
];

const appointmentStmt = db.prepare(
  'INSERT INTO appointments (customer_id, artist_name, appointment_date, duration, status, notes) VALUES (?, ?, ?, ?, ?, ?)'
);

appointments.forEach(apt => {
  appointmentStmt.run(
    apt.customer_id,
    apt.artist_name,
    apt.appointment_date,
    apt.duration,
    apt.status,
    apt.notes
  );
});

console.log(`✅ Added ${appointments.length} appointments`);

// Sample Portfolio
const portfolioItems = [
  {
    title: 'Japanese Dragon Sleeve',
    description: 'Full sleeve featuring traditional Japanese dragon with cherry blossoms and waves',
    image_url: 'https://images.unsplash.com/photo-1565058683374-c76d93cd0d0b?w=800',
    artist_name: 'Mike Rodriguez',
    tags: 'japanese, dragon, sleeve, traditional, color'
  },
  {
    title: 'Watercolor Phoenix',
    description: 'Vibrant watercolor style phoenix on back',
    image_url: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=800',
    artist_name: 'Sarah Chen',
    tags: 'watercolor, phoenix, back, color, artistic'
  },
  {
    title: 'Geometric Mandala',
    description: 'Intricate geometric mandala design on forearm',
    image_url: 'https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800',
    artist_name: 'Alex Thompson',
    tags: 'geometric, mandala, blackwork, forearm, symmetry'
  },
  {
    title: 'Portrait Memorial',
    description: 'Realistic portrait memorial piece',
    image_url: 'https://images.unsplash.com/photo-1590246814883-57c511e4e394?w=800',
    artist_name: 'Alex Thompson',
    tags: 'portrait, realistic, memorial, black and grey'
  },
  {
    title: 'Traditional Rose',
    description: 'Classic traditional American rose with bold lines',
    image_url: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=800',
    artist_name: 'Sarah Chen',
    tags: 'traditional, rose, american traditional, color'
  }
];

const portfolioStmt = db.prepare(
  'INSERT INTO portfolio (title, description, image_url, artist_name, tags) VALUES (?, ?, ?, ?, ?)'
);

portfolioItems.forEach(item => {
  portfolioStmt.run(
    item.title,
    item.description,
    item.image_url,
    item.artist_name,
    item.tags
  );
});

console.log(`✅ Added ${portfolioItems.length} portfolio items`);

// Sample Generated Tattoos
const generatedTattoos = [
  {
    prompt: 'A phoenix rising from flames in traditional Japanese style',
    description: 'Traditional Japanese phoenix (Hō-ō) design featuring bold outlines and vibrant colors. The phoenix should be depicted rising from stylized flames, with detailed feathers showing traditional Japanese artistic elements. Placement: Back or upper arm. Size: Medium to large (8-12 inches). Colors: Deep reds, oranges, and golds for the flames, with the phoenix in traditional Japanese colors including blues, greens, and purples. Style elements include flowing feathers, determined eyes, and dynamic composition showing upward movement.'
  },
  {
    prompt: 'Minimalist mountain range on forearm',
    description: 'Clean, minimalist line work depicting a mountain range. Single continuous line or simple geometric shapes forming mountain silhouettes. Placement: Inner forearm. Size: 4-6 inches wide. Black ink only, thin to medium line weight. Modern, simple aesthetic with negative space. Could include subtle dotwork for shading or texture. Consider adding small elements like a sun or moon for balance.'
  }
];

const generatedStmt = db.prepare(
  'INSERT INTO generated_tattoos (prompt, description) VALUES (?, ?)'
);

generatedTattoos.forEach(tattoo => {
  generatedStmt.run(tattoo.prompt, tattoo.description);
});

console.log(`✅ Added ${generatedTattoos.length} generated tattoo examples`);

db.close();

console.log('\n✨ Database seeding completed successfully!');
console.log('\nYou can now start the application and see the sample data.');
console.log('Run: npm run dev\n');
