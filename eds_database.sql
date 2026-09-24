-- ========================================================
-- EDS (Eduard Distribution Supplies) Database Export
-- ========================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'worker', 'owner')),
    delivery_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    stock INT NOT NULL CHECK (stock >= 0),
    sold_units INT DEFAULT 0 CHECK (sold_units >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    client_id INT REFERENCES users(id) ON DELETE SET NULL,
    client_name VARCHAR(100) NOT NULL,
    client_address TEXT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'COD',
    assigned_worker VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Delivered', 'Cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(150) NOT NULL,
    price_per_unit DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0)
);

-- ========================================================
-- SEED DATA (10 Records per table)
-- ========================================================

-- INSERT USERS
INSERT INTO users (full_name, email, password_hash, role, delivery_address) VALUES
('Eduard Owner', 'owner@eds.com', '$2b$10$e8.HashOwner123', 'owner', NULL),
('Ijho Worker', 'ijho@eds.com', '$2b$10$e8.HashWorker1', 'worker', NULL),
('Cj Worker', 'cj@eds.com', '$2b$10$e8.HashWorker2', 'worker', NULL),
('Maria Santos', 'maria.santos@gmail.com', '$2b$10$e8.HashClient1', 'client', '123 Rizal St, Brgy. Poblacion, Cebu City'),
('Juan Dela Cruz', 'juan.delacruz@yahoo.com', '$2b$10$e8.HashClient2', 'client', '45 Mabini Ave, Pasig City, Metro Manila'),
('Ana Reyes', 'ana.reyes@hotmail.com', '$2b$10$e8.HashClient3', 'client', '78 Bonifacio Ave, Davao City'),
('Mark Tan', 'mark.tan@gmail.com', '$2b$10$e8.HashClient4', 'client', '12 Roxas Blvd, Pasay City, Metro Manila'),
('Grace Lim', 'grace.lim@outlook.com', '$2b$10$e8.HashClient5', 'client', '88 Quezon Ave, Quezon City'),
('Paul Garcia', 'paul.garcia@gmail.com', '$2b$10$e8.HashClient6', 'client', '55 Osmeña St, Iloilo City'),
('Liza Soberano', 'liza.s@gmail.com', '$2b$10$e8.HashClient7', 'client', '99 Luna St, Baguio City')
ON CONFLICT (email) DO NOTHING;

-- INSERT PRODUCTS
INSERT INTO products (name, price, stock, sold_units) VALUES
('Black Pens (1 Box - 12 pcs)', 150.00, 40, 10),
('A4 Bond Paper (1 Ream)', 220.00, 25, 15),
('Spiral Notebooks (Pack of 5)', 120.00, 60, 20),
('Heavy Duty Stapler with Staples', 350.00, 15, 5),
('Correction Tape (Set of 3)', 85.00, 50, 12),
('Permanent Markers (Black/Blue/Red)', 110.00, 30, 8),
('Transparent Packing Tape 2"', 45.00, 100, 40),
('Sticky Notes 3x3 (Pack of 4)', 95.00, 45, 18),
('Thermal Receipt Paper Roll (10 pcs)', 300.00, 20, 7),
('Manila Envelopes (Short - 25 pcs)', 75.00, 80, 25);

-- INSERT ORDERS
INSERT INTO orders (id, client_id, client_name, client_address, total_amount, payment_method, assigned_worker, status, created_at) VALUES
('ORD-1001', 4, 'Maria Santos', '123 Rizal St, Brgy. Poblacion, Cebu City', 370.00, 'COD', 'Worker 1', 'Delivered', NOW() - INTERVAL '1 DAY'),
('ORD-1002', 5, 'Juan Dela Cruz', '45 Mabini Ave, Pasig City, Metro Manila', 440.00, 'COD', 'Worker 2', 'Delivered', NOW() - INTERVAL '2 DAYS'),
('ORD-1003', 6, 'Ana Reyes', '78 Bonifacio Ave, Davao City', 350.00, 'COD', 'Worker 1', 'Pending', NOW() - INTERVAL '3 HOURS'),
('ORD-1004', 7, 'Mark Tan', '12 Roxas Blvd, Pasay City, Metro Manila', 255.00, 'COD', 'Worker 2', 'Delivered', NOW() - INTERVAL '3 DAYS'),
('ORD-1005', 8, 'Grace Lim', '88 Quezon Ave, Quezon City', 600.00, 'COD', 'Worker 1', 'Pending', NOW() - INTERVAL '1 HOUR'),
('MAN-1006', NULL, 'Walk-in / Manual Sale', 'Store Counter', 150.00, 'Cash', 'Worker 1', 'Delivered', NOW() - INTERVAL '4 DAYS'),
('MAN-1007', NULL, 'Walk-in / Manual Sale', 'Store Counter', 90.00, 'Cash', 'Worker 2', 'Delivered', NOW() - INTERVAL '5 DAYS'),
('ORD-1008', 9, 'Paul Garcia', '55 Osmeña St, Iloilo City', 220.00, 'COD', 'Worker 2', 'Delivered', NOW() - INTERVAL '6 DAYS'),
('ORD-1009', 10, 'Liza Soberano', '99 Luna St, Baguio City', 190.00, 'COD', 'Worker 1', 'Pending', NOW() - INTERVAL '30 MINUTES'),
('MAN-1010', NULL, 'Walk-in / Manual Sale', 'Store Counter', 220.00, 'Cash', 'Worker 2', 'Delivered', NOW() - INTERVAL '6 DAYS')
ON CONFLICT (id) DO NOTHING;

-- INSERT ORDER ITEMS
INSERT INTO order_items (order_id, product_id, product_name, price_per_unit, quantity) VALUES
('ORD-1001', 1, 'Black Pens (1 Box - 12 pcs)', 150.00, 1),
('ORD-1001', 2, 'A4 Bond Paper (1 Ream)', 220.00, 1),
('ORD-1002', 2, 'A4 Bond Paper (1 Ream)', 220.00, 2),
('ORD-1003', 4, 'Heavy Duty Stapler with Staples', 350.00, 1),
('ORD-1004', 5, 'Correction Tape (Set of 3)', 85.00, 3),
('ORD-1005', 9, 'Thermal Receipt Paper Roll (10 pcs)', 300.00, 2),
('MAN-1006', 1, 'Black Pens (1 Box - 12 pcs)', 150.00, 1),
('MAN-1007', 7, 'Transparent Packing Tape 2"', 45.00, 2),
('ORD-1008', 2, 'A4 Bond Paper (1 Ream)', 220.00, 1),
('ORD-1009', 8, 'Sticky Notes 3x3 (Pack of 4)', 95.00, 2);
