const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Database connection gamit ang Render Cloud Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Kumuha ng lahat ng Orders (Para sa Owner at Workers)
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

// Pag-create ng Order ng Client (May kasamang assignedWorker)
app.post('/api/orders', async (req, res) => {
  const { id, clientName, clientAddress, items, totalPrice, paymentMethod, assignedWorker, status } = req.body;
  try {
    await pool.query(
      'INSERT INTO orders (id, client_name, client_address, total_amount, payment_method, assigned_worker, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, clientName, clientAddress, totalPrice, paymentMethod, assignedWorker, status]
    );
    
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

// Pag-update ng Status ng Worker (Mark as Delivered/Received)
app.patch('/api/orders/:id/complete', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['Delivered', id]);
    res.json({ message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
