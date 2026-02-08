# Security Design

## 1. Goal
The primary security goal is to prevent **Service Denial (Spam Orders)** and **Session Hijacking**, ensuring that only customers physically present at the table can place orders, and only after staff approval.

## 2. Threat Model & Mitigations

### Threat: Remote Spam Orders (QR Code Leaked)
*Scenario*: Someone takes a picture of the QR code and requests orders from home.
*Mitigation*: **Human-in-the-loop Protocol**.
- The QR code only opens a read-only menu.
- To order, a "Session Request" is made.
- Staff must **visually** confirm the table is occupied by a new customer before approving the request on the dashboard.
- If a request comes in for an empty table, Staff checks "Reject".
- *Bonus*: Geo-fencing is unreliable for web apps (easy to spoof), so we rely on Human verification. The application will, however, capture IP addresses to block repeat offenders.

### Threat: Session Hijacking (Theft of Session Token)
*Scenario*: Attacker snoops on local network to steal the session token.
*Mitigation*: **Secure Transport & Token Binding**.
- **HTTPS Only**: All traffic encrypted.
- **HttpOnly Cookies**: Session tokens stored in HttpOnly cookies to prevent XSS theft.
- **Short-lived Tokens**: Active session tokens expire rapidly if no activity, but for a restaurant setting, inactivity is common. We will rely on manual closure or "Activity Heartbeats".
- **One Session Per Table**: If a new session is requested for an active table, the system alerts the staff. Staff can "Kick" the old session if it was abandoned, or "Reject" the new one if it's an attack.

### Threat: DoS on Websocket
*Scenario*: Spammer opens 1000 socket connections.
*Mitigation*:
- **Rate Limiting**: Nginx/Express rate limiting on IP basis.
- **Socket Auth**: Socket connections must handshake with a temporary public token first.
- **Connection limit per IP**: Limit max concurrent connections per IP.

## 3. Session State Logic
- **Single Active Device**: Ideally, we want one "Master" device per table to avoid order synchronization conflicts (split brain).
- **Implementation**:
    1.  Device A scans -> Request Access.
    2.  Staff Approves -> Device A gets `session_token`.
    3.  Device B scans -> Sees "Table Occupied / Session Active".
    4.  Device B can "Join" (View order status) but maybe not modify? OR we strictly enforce 1 Controller.
    -   *Decision*: **Strict 1 Device Policy** for MVP. Easier to manage. Only the session creator can place orders. If they leave, session must be closed by staff.

## 4. Input Validation
- **SQL Injection**: Prevented by using Parameterized Queries (via TypeORM/Sequelize or properly constructed pg queries).
- **XSS**: React automatically escapes content. Content Security Policy (CSP) will be configured.
- **Data Validation**: API uses `Joi` or `Zod` to validate all incoming JSON (order quantities, product IDs).
