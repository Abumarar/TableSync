# Product Definition

## Overview
TableSync is a smart contactless ordering system for cafes and restaurants in Jordan, replacing paper menus with a BYOD (Bring Your Own Device) static QR model. It emphasizes security and spam prevention through a staff verification workflow.

## Core Core Concept
1. **Static QR Code**: Each table has a unique, permanent QR code.
2. **Read-Only Menu**: Scanning opens the menu initially in read-only mode.
3. **Access Request**: Customer requests "Ordering Access" for their table.
4. **Staff Verification**: Staff verifies the request (visually confirming the customer) and approves it from a dashboard.
5. **Active Session**: One active session per table allows the customer to place orders.
6. **Session Expiry**: Sessions auto-close on inactivity or payment.

## User Roles & Permissions

### 1. Customer (Guest)
- **Access**: Public URL (via QR scan).
- **Capabilities**:
    - View Menu (Categories, Items, Prices, Availability).
    - Request Ordering Access (requires entering a name/seat check).
    - Place Orders (once session is active).
    - View Order Status (Received, Preparing, Ready).
    - Cancel items (only before confirmation/preparation starts).
    - Payment is handled physically (cash requests/bill requests), but the system tracks the session state.

### 2. Staff (Waiter/Manager)
- **Access**: Protected Dashboard.
- **Capabilities**:
    - View Live Status of all tables (Available, Pending Request, Active, Occupied).
    - Approve/Reject Access Requests.
    - View Incoming Orders.
    - Update Order Status (Preparing, Ready, Served).
    - Manually Close/Kick Sessions.
    - View Menu Availability (toggle items out of stock).

### 3. Kitchen Display (Optional/Role)
- **Access**: Protected Kitchen View.
- **Capabilities**:
    - View Stream of Active Orders.
    - Mark Items/Orders as Ready.

### 4. Admin
- **Access**: Admin Panel (or Database access for MVP).
- **Capabilities**:
    - Manage Staff Accounts.
    - Manage Menu (Add/Edit/Delete products & categories).
    - Configure Tables (Generate QR strings).

## Explicit Non-Goals
- **No In-App Payments**: Payment is handled externally (Cash/Card terminal brought to table). The app only tracks the order.
- **No Mobile App**: Web-only (PWA capable) to reduce friction.
- **No Dynamic QR**: QR codes are stickers on tables, they do not change.
- **No User Accounts for Customers**: Customers do not login or sign up. Identity is ephemeral (per session).
- **No Complex Inventory Management**: Simple "Available/Unavailable" toggle.
