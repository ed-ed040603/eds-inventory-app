const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // PostgreSQL (Kon MySQL, gamita ang 'mysql2' package)

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// DATABASE CONNECTION CONFIGURATION
// I-replace ang mga values sa imong sariling database credentials
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'eds_db',
  password: 'your_password',
  port: 5432,
});

// ==========================================
// 1. USERS ENDPOINTS (Auth & Registration)
// ==========================================

// Register New User
app.post('/api/users/register', async (req, res) => {
  const { name, email, pass, role, location } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO users (full_name, email, password_hash, role, delivery_address) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, pass, role, location || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login User
app.post('/api/users/login', async (req, res) => {
  const { email, pass } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND password_hash = $2',
      [email, pass]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    res.json({
      name: user.full_name,
      email: user.email,
      role: user.role,
      location: user.delivery_address
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. PRODUCTS ENDPOINTS (Inventory Management)
// ==========================================

// Get All Products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, price, stock, sold_units AS sold FROM products ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add New Product (Owner)
app.post('/api/products', async (req, res) => {
  const { name, price, stock } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (name, price, stock, sold_units) VALUES ($1, $2, $3, 0) RETURNING *',
      [name, price, stock]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Product (Owner)
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. ORDERS ENDPOINTS (Checkout & Auto-reset)
// ==========================================

// Get All Orders
app.get('/api/orders', async (req, res) => {
  try {
    const ordersResult = await pool.query(`
      SELECT o.id, o.client_name AS "clientName", o.client_address AS "clientAddress", 
             o.total_amount AS "totalPrice", o.payment_method AS "paymentMethod", 
             o.assigned_worker AS "assignedWorker", o.status, 
             EXTRACT(EPOCH FROM o.created_at) * 1000 AS "createdAt"
      FROM orders o
      ORDER BY o.created_at DESC
    `);
    
    const orders = ordersResult.rows;
    
    for (let order of orders) {
      const itemsResult = await pool.query(
        'SELECT product_id AS id, product_name AS name, price_per_unit AS price, quantity AS qty FROM order_items WHERE order_id = $1',
        [order.id]
      );
      order.items = itemsResult.rows;
    }
    
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create New Order
app.post('/api/orders', async (req, res) => {
  const { id, clientName, clientAddress, items, totalPrice, paymentMethod, assignedWorker, status } = req.body;
  try {
    // 1. Insert into orders table
    await pool.query(
      'INSERT INTO orders (id, client_name, client_address, total_amount, payment_method, assigned_worker, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, clientName, clientAddress, totalPrice, paymentMethod, assignedWorker, status]
    );
    
    // 2. Insert order items & Update stock
    for (let item of items) {
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, product_name, price_per_unit, quantity) VALUES ($1, $2, $3, $4, $5)',
        [id, item.id, item.name, item.price, item.qty]
      );
      
      await pool.query(
        'UPDATE products SET stock = stock - $1, sold_units = sold_units + $1 WHERE id = $2',
        [item.qty, item.id]
      );
    }
    
    res.status(201).json({ message: 'Order created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Order Status (Mark Delivered)
app.patch('/api/orders/:id/complete', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['Delivered', id]);
    res.json({ message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// START SERVER
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 EDS Database Server running on http://localhost:${PORT}`);
});