# System Architecture

## Overview
TableSync follows a client-server architecture with real-time bidirectional communication.

- **Frontend**: React SPA (Single Page Application) with Redux for state management.
- **Backend**: Node.js + Express REST API.
- **Real-time**: Socket.io for order updates and session state synchronization.
- **Database**: PostgreSQL (Relational Data).

## Tech Stack Justification
- **React + Tailwind + Redux**: High interactivity required for the menu and dashboard. Redux is crucial for managing the complex state of active orders and session status across components. Tailwind ensures rapid, responsive UI development.
- **Node.js + Express**: Non-blocking I/O is ideal for real-time applications handling concurrent connections (tables/staff).
- **Socket.io**: Essential for the instant "Request -> Approve" flow and "Order Placed -> Kitchen Notification" loop. Polling would be too slow or resource-intensive.
- **PostgreSQL**: Strong relational integrity is needed for Orders -> OrderItems -> Products relationships. Better suited than NoSQL for structured transactional data.

## Architecture

### frontend structure
- **Customer App**: `/menu/:tableId`
- **Staff App**: `/staff/*` (Protected)
- **Kitchen App**: `/kitchen` (Protected)

### State Machine (Session Lifecycle)
The core logic revolves around the `TableSession` state.

1.  **IDLE**: Table is empty. Functionally equivalent to "No Active Session".
2.  **SCANNED (Client-side only)**: Customer scans QR. Menu is Read-Only.
3.  **REQUESTED**: Customer clicks "Start Ordering".
    -   *Socket Event*: `session:request`
    -   *Status*: `PENDING_APPROVAL`
4.  **ACTIVE**: Staff approves request.
    -   *Socket Event*: `session:active`
    -   *Status*: `ACTIVE`
    -   Customer acts as "Session Leader".
5.  **LOCKED/PAYMENT**: (Optional) Customer requests bill. Ordering disabled.
6.  **CLOSED**: Session ended. Table returns to IDLE.

## Database Schema (PostgreSQL)

```sql
-- Users (Staff/Admins)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff', 'kitchen')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tables (Physical Tables)
CREATE TABLE tables (
    id SERIAL PRIMARY KEY,
    table_number INTEGER UNIQUE NOT NULL,
    qr_code VARCHAR(255) UNIQUE NOT NULL, -- The static string/URL param
    current_session_id INTEGER NULL -- Optimization to quickly find active session
);

-- Categories
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Products
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions (The core of the logic)
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    table_id INTEGER REFERENCES tables(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'active', 'closed', 'refused')),
    customer_name VARCHAR(50), -- Optional prompt for "Name" when requesting
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    device_fingerprint VARCHAR(255) -- Basic abuse prevention (IP or browser ID)
);

-- Orders
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled')),
    total_amount DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_time DECIMAL(10, 2) NOT NULL, -- Snapshot of price
    notes VARCHAR(255) -- "No onions" etc.
);
```

## API Design

### REST Endpoints
- `GET /api/menu`: Public, fetch categories and products.
- `GET /api/tables/:id/status`: Check if table is occupied/active.
- `POST /api/auth/login`: Staff login.
- `POST /api/orders`: Submit order (Requires Active Session Token).
- `GET /api/orders`: History (Staff/Session based).

### Socket Events
- `join_table_channel`: Client joins room `table_{id}`.
- `join_staff_channel`: Staff joins room `staff`.
- `request_session`: { tableId, customerName } -> Emits `staff:new_request`
- `approve_session`: { sessionId } -> Emits `table_{id}:session_approved`
- `place_order`: { orderDetails } -> Emits `staff:new_order` & `kitchen:new_order`
- `order_status_update`: { orderId, newStatus } -> Emits `table_{id}:order_update`
