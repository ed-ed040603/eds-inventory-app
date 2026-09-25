const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Koneksyon sa PostgreSQL Database (Ilisi ang mga detalye sumala sa imong database)
const pool = new Pool({
    user: 'your_db_user',
    host: 'localhost',
    database: 'eds_db',
    password: 'your_db_password',
    port: 5432,
});

// --- USER REGISTRATION (Naay Bcrypt Hashing) ---
app.post('/api/users/register', async (req, res) => {
    try {
        const { full_name, email, pass, role, delivery_address } = req.body;
        
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(pass, saltRounds);

        const query = `
            INSERT INTO users (full_name, email, password_hash, role, delivery_address) 
            VALUES ($1, $2, $3, $4, $5) RETURNING id, full_name, email, role;
        `;
        const values = [full_name, email, password_hash, role, delivery_address];
        const result = await pool.query(query, values);

        res.status(201).json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error sa pagrehistro' });
    }
});

// --- USER LOGIN ---
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, pass } = req.body;
        
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Wala makit-an ang email.' });
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(pass, user.password_hash);
        
        if (!match) {
            return res.status(400).json({ success: false, message: 'Sayop ang password.' });
        }

        res.json({ 
            success: true, 
            message: 'Nakalog-in na!', 
            user: { id: user.id, name: user.full_name, role: user.role } 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error sa pag-login' });
    }
});

// --- KUHAON ANG MGA PRODUKTO ---
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error sa pagkuha sa mga produkto' });
    }
});

// --- PAGHIMO OG ORDER ---
app.post('/api/orders', async (req, res) => {
    try {
        const { user_id, total_amount, items } = req.body;
        
        const query = `
            INSERT INTO orders (user_id, total_amount, status) 
            VALUES ($1, $2, 'Pending') RETURNING id;
        `;
        const result = await pool.query(query, [user_id, total_amount]);
        
        res.status(201).json({ success: true, orderId: result.rows[0].id, message: 'Napasa ang order!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error sa order' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Nag-run ang EDS server sa port ${PORT}`);
});
