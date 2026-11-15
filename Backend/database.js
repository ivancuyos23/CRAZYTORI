const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'crazy_tori.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the local Crazy Tori SQLite database.');
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    date TEXT,
    paymentMethod TEXT,
    total REAL,
    discount REAL,
    items TEXT,
    cashierName TEXT
  )`);
  db.run(`ALTER TABLE transactions ADD COLUMN servingNo INTEGER`, () => {});

  db.run(`CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    date TEXT,
    category TEXT,
    description TEXT,
    amount REAL,
    loggedBy TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    category TEXT,
    price REAL,
    sizes TEXT,
    image TEXT
  )`, () => {
    db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
      if (row.count === 0) {
        const initialProducts = [
          // Food
          { name: 'Rice Bowl - Signature', category: 'Food', price: 170, sizes: null, image: '/images/ricebowl.jfif' },
          { name: 'Rice Bowl - Orenji', category: 'Food', price: 170, sizes: null, image: '/images/ricebowl.jfif' },
          { name: 'Rice Bowl - Sesame', category: 'Food', price: 170, sizes: null, image: '/images/ricebowl.jfif' },
          { name: 'Snack Box - Chicken & Fries', category: 'Food', price: 150, sizes: null, image: '/images/snackbox.jfif' },
          { name: 'Snack Box - All Chicken', category: 'Food', price: 150, sizes: null, image: '/images/snackbox.jfif' },
          { name: 'Snack Box - All Fries', category: 'Food', price: 150, sizes: null, image: '/images/snackbox.jfif' },
          { name: 'Spamusubi', category: 'Food', price: 100, sizes: null, image: '/images/spamusubi.jpg' },
          { name: 'Takoyaki (octopus)', category: 'Food', price: 100, sizes: null },
          { name: 'Ebiyaki (shrimp)', category: 'Food', price: 100, sizes: null },
          { name: 'Chizuyaki (cheese)', category: 'Food', price: 100, sizes: null },
          { name: 'Katsudon', category: 'Food', price: 170, sizes: null, image: '/images/ricebowl.jfif' },
          
          // Drinks
          { name: 'Thai Iced Tea', category: 'Drinks', price: 60, sizes: JSON.stringify({ '16oz': 60, '22oz': 80 }) },
          { name: 'Yellow Lemonade', category: 'Drinks', price: 50, sizes: JSON.stringify({ '16oz': 50, '22oz': 70 }) },
          { name: 'Pink Lemonade', category: 'Drinks', price: 50, sizes: JSON.stringify({ '16oz': 50, '22oz': 70 }) },
          { name: 'Matcha Latte', category: 'Drinks', price: 60, sizes: JSON.stringify({ '16oz': 60, '22oz': 80 }) },
          { name: 'Matcha Cafe', category: 'Drinks', price: 60, sizes: JSON.stringify({ '16oz': 60, '22oz': 80 }) },
          { name: 'Matcha Strawberry', category: 'Drinks', price: 70, sizes: JSON.stringify({ '16oz': 70, '22oz': 90 }) },
          { name: 'HL Ginger Tea', category: 'Drinks', price: 50, sizes: JSON.stringify({ '8oz': 50, '16oz': 70 }) },
          { name: 'Calamansi', category: 'Drinks', price: 40, sizes: JSON.stringify({ '8oz': 40, '16oz': 60 }) },
          { name: 'Coffee', category: 'Drinks', price: 50, sizes: JSON.stringify({ '8oz': 50, '16oz': 70 }) },
          { name: 'Spanish latte', category: 'Drinks', price: 70, sizes: JSON.stringify({ '8oz': 70, '16oz': 90 }) },
          { name: 'Mocha', category: 'Drinks', price: 70, sizes: JSON.stringify({ '8oz': 70, '16oz': 90 }) },
          { name: 'Cafe latte', category: 'Drinks', price: 60, sizes: JSON.stringify({ '8oz': 60, '16oz': 80 }) },
          { name: 'Chocolate', category: 'Drinks', price: 60, sizes: JSON.stringify({ '8oz': 60, '16oz': 80 }) },
          { name: 'Americano', category: 'Drinks', price: 50, sizes: JSON.stringify({ '8oz': 50, '16oz': 70 }) },
          { name: 'Caramel macchiato', category: 'Drinks', price: 75, sizes: JSON.stringify({ '8oz': 75, '16oz': 95 }) },
          { name: 'Thai milk tea', category: 'Drinks', price: 80, sizes: JSON.stringify({ '22oz': 80 }) },
          { name: 'Strawberry milk tea', category: 'Drinks', price: 80, sizes: JSON.stringify({ '22oz': 80 }) },
          { name: 'Water 500ml', category: 'Drinks', price: 30, sizes: null }
        ];

        const stmt = db.prepare("INSERT INTO products (name, category, price, sizes, image) VALUES (?, ?, ?, ?, ?)");
        initialProducts.forEach(p => {
          stmt.run(p.name, p.category, p.price, p.sizes, p.image);
        });
        stmt.finalize();
      }
    });
  });

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    pin TEXT,
    role TEXT
  )`, () => {
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
      if (row.count === 0) {
        db.run(`INSERT INTO users (username, pin, role) VALUES ('Admin Owner', '1234', 'Admin')`);
        db.run(`INSERT INTO users (username, pin, role) VALUES ('Cashier 1', '5678', 'Cashier')`);
      }
    });
  });

  // 5. Persistent Store Settings Table (Permissions, Float, Serving No)
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )`, () => {
    const defaultPermissions = JSON.stringify({
      canVoidTransactions: false,
      canFilterTransactionDates: false,
      canViewDSR: false,
      canViewUsage: false,
      canLogExpenses: false,
      canDeleteExpenses: false,
      canManageMenu: false
    });
    db.run(
      `INSERT OR IGNORE INTO settings (key, value) VALUES ('permissions', ?)`,
      [defaultPermissions]
    );
  });
});

module.exports = db;