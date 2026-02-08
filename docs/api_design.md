# API Design

## REST Endpoints

### Auth (Staff)
- `POST /api/auth/login`
  - Body: `{ username, password }`
  - Response: `{ token, user: { id, role, ... } }`
- `POST /api/auth/logout`

### Tables
- `GET /api/tables`
  - Response: `[{ id, tableNumber, status: 'IDLE'|'ACTIVE'|'PENDING', ... }]`
- `GET /api/tables/:id`
  - Response: `{ id, tableNumber, currentSession: { ... } }`
- `POST /api/tables` (Admin)
  - Body: `{ tableNumber }`

### Menu (Public)
- `GET /api/menu`
  - Response: `{ categories: [{ id, name, products: [{ id, name, price, available }] }] }`

### Sessions
- `POST /api/sessions/request`
  - Body: `{ tableId, customerName? }`
  - Response: `{ sessionId, status: 'PENDING' }`
- `POST /api/sessions/:id/approve` (Staff)
  - Response: `{ status: 'ACTIVE' }`
- `POST /api/sessions/:id/close` (Staff)
  - Response: `{ status: 'CLOSED' }`

### Orders
- `GET /api/orders` (Staff/Kitchen)
  - Query: `?status=pending` (optional)
  - Response: `[{ id, tableNumber, items: [...], status, ... }]`
- `POST /api/orders` (Customer - Protected by Session Token)
  - Body: `{ items: [{ productId, quantity, notes }] }`
  - Response: `{ orderId, status: 'PENDING' }`
- `PATCH /api/orders/:id/status` (Staff/Kitchen)
  - Body: `{ status: 'PREPARING'|'READY'|'SERVED' }`
  - Response: `{ success: true }`

## Socket.io Events

### Namespaces / Rooms
- `staff`: Room for all staff members (waiters, managers). Receive new requests and orders.
- `kitchen`: Room for kitchen display. Receives confirmed orders.
- `table_{id}`: Room for a specific table. Receives status updates for that table's session.

### Client -> Server
- `join_table`: `{ tableId }` - Client joins their table's room.
- `join_staff`: `{ token }` - Staff joins staff room (auth required).
- `session_request`: `{ tableId, name }` - Customer requests access.
- `place_order`: `{ orderDetails }` - Customer places order.

### Server -> Client
- `staff:new_request`: `{ tableId, tableName, sessionId }` - Broadcast to Staff.
- `staff:new_order`: `{ orderId, tableId, items }` - Broadcast to Staff.
- `kitchen:new_order`: `{ orderId, items }` - Broadcast to Kitchen.
- `table_{id}:session_approved`: `{ token }` - Sent to specific table when approved.
- `table_{id}:order_update`: `{ orderId, status }` - Sent to table when order status changes.
- `table_{id}:session_closed`: `{ reason }` - Sent to table when session ends.
