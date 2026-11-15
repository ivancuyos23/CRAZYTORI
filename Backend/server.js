const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ensure new columns exist on existing SQLite tables without losing data
db.serialize(() => {
  db.run(`ALTER TABLE transactions ADD COLUMN servingNo INTEGER`, () => {});
  db.run(`ALTER TABLE transactions ADD COLUMN referenceNo TEXT`, () => {});
});

// 1. AUTHENTICATION & ADMIN PIN SECURITY
app.post('/api/login', (req, res) => {
  const { pin } = req.body;
  db.get("SELECT * FROM users WHERE pin = ?", [pin], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Invalid PIN' });
    res.json({ success: true, user: { username: user.username, role: user.role } });
  });
});

app.put('/api/login/pin', (req, res) => {
  const { currentPin, newPin } = req.body;
  if (!newPin || String(newPin).length !== 4) {
    return res.status(400).json({ error: 'New PIN must be 4 digits' });
  }

  db.get("SELECT * FROM users WHERE role = 'Admin' AND pin = ?", [currentPin], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Current Admin PIN is incorrect' });

    db.run("UPDATE users SET pin = ? WHERE role = 'Admin'", [newPin], function(updateErr) {
      if (updateErr) return res.status(500).json({ error: updateErr.message });
      res.json({ success: true, message: 'Admin PIN updated successfully' });
    });
  });
});

// 2. TRANSACTIONS API (POS Checkout & Admin Void)
app.get('/api/transactions', (req, res) => {
  db.all("SELECT * FROM transactions ORDER BY date DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const formatted = rows.map(row => ({
      ...row,
      items: JSON.parse(row.items || '[]')
    }));
    res.json(formatted);
  });
});

app.post('/api/transactions', (req, res) => {
  const { id, date, servingNo, paymentMethod, total, discount, items, cashierName, referenceNo } = req.body;
  const query = `
    INSERT INTO transactions (id, date, servingNo, paymentMethod, total, discount, items, cashierName, referenceNo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.run(
    query,
    [
      id,
      date,
      servingNo || 1,
      paymentMethod,
      total,
      discount || 0,
      JSON.stringify(items || []),
      cashierName || 'Cashier',
      referenceNo || null
    ],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Transaction saved successfully', id });
    }
  );
});

app.delete('/api/transactions/:id', (req, res) => {
  db.run("DELETE FROM transactions WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Transaction voided', id: req.params.id });
  });
});

// 3. EXPENSES API (3-Tier Store Expenses)
app.get('/api/expenses', (req, res) => {
  db.all("SELECT * FROM expenses ORDER BY date DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/expenses', (req, res) => {
  const { id, date, category, description, amount, loggedBy } = req.body;
  const query = `
    INSERT INTO expenses (id, date, category, description, amount, loggedBy)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.run(query, [id, date, category, description, amount, loggedBy || 'Admin'], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Expense saved successfully', id });
  });
});

app.delete('/api/expenses/:id', (req, res) => {
  db.run("DELETE FROM expenses WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Expense deleted', id: req.params.id });
  });
});

// 4. PRODUCTS / MENU CATALOG API
app.get('/api/products', (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const formatted = rows.map(r => ({
      ...r,
      sizes: r.sizes ? JSON.parse(r.sizes) : null
    }));
    res.json(formatted);
  });
});

app.post('/api/products', (req, res) => {
  const { name, category, price, sizes, image } = req.body;
  const query = `
    INSERT INTO products (name, category, price, sizes, image)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.run(
    query,
    [name, category, price, sizes ? JSON.stringify(sizes) : null, image || null],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, category, price });
    }
  );
});

app.put('/api/products/:id', (req, res) => {
  const { name, category, price, sizes, image } = req.body;
  const query = `
    UPDATE products
    SET name = ?, category = ?, price = ?, sizes = ?, image = ?
    WHERE id = ?
  `;
  db.run(
    query,
    [name, category, price, sizes ? JSON.stringify(sizes) : null, image || null, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Product updated' });
    }
  );
});

app.delete('/api/products/:id', (req, res) => {
  db.run("DELETE FROM products WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Product deleted' });
  });
});

// Get persistent permissions & settings
app.get('/api/settings/permissions', (req, res) => {
  db.get("SELECT value FROM settings WHERE key = 'permissions'", [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row ? JSON.parse(row.value) : {});
  });
});

// Save persistent permissions & settings
app.put('/api/settings/permissions', (req, res) => {
  const valueStr = JSON.stringify(req.body || {});
  db.run(
    `INSERT INTO settings (key, value) VALUES ('permissions', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [valueStr],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, permissions: req.body });
    }
  );
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Crazy Tori local backend server running on http://0.0.0.0:${PORT}`);
});