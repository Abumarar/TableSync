-- Users (Staff/Admins)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff', 'kitchen')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tables (Physical Tables)
CREATE TABLE IF NOT EXISTS tables (
    id SERIAL PRIMARY KEY,
    table_number INTEGER UNIQUE NOT NULL,
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    current_session_id INTEGER NULL
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    table_id INTEGER REFERENCES tables(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'active', 'closed', 'refused')),
    customer_name VARCHAR(50),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    device_fingerprint VARCHAR(255)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled')),
    total_amount DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_time DECIMAL(10, 2) NOT NULL,
    notes VARCHAR(255)
);

-- Create initial admin user (password: admin123)
-- Hash generated using bcrypt hash('admin123', 10)
INSERT INTO users (username, password_hash, role) 
VALUES ('admin', '$2b$10$tZ2.Q/6.u/3.u/3.u/3.uu', 'admin') 
ON CONFLICT (username) DO NOTHING;
