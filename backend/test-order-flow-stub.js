const API_URL = 'http://localhost:5000/api';

const runTest = async () => {
    try {
        console.log('--- Order Flow Test ---');

        // 1. Admin Login
        console.log('1. Logging in as admin...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
        const loginData = await loginRes.json();
        const authToken = loginData.token;
        console.log('   Admin logged in.');

        // 2. Request Session (Customer)
        console.log('2. Requesting session for Table 10...');
        const reqRes = await fetch(`${API_URL}/sessions/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableId: 10, customerName: 'Order Tester' })
        });
        const sessionData = await reqRes.json();
        const sessionId = sessionData.id;
        console.log(`   Session requested. ID: ${sessionId}`);

        // 3. Approve Session (Admin)
        console.log('3. Approving session...');
        await fetch(`${API_URL}/sessions/${sessionId}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log('   Session approved.');

        // 4. Place Order (Customer) - Need 1 product at least. Assume product ID 1 exists.
        console.log('4. Placing order...');
        // We need a product. Let's assume ID 1 exists from seed/reset.
        // If not, we might fail here.
        const orderRes = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // For this test script, we simulate the "customer session" by just knowing the ID 
                // BUT wait, placeOrder requires `req.user` which comes from token.
                // We need the SESSION TOKEN returned by approve? 
                // No, approve just sets status. The socket event sends the token to client. 
                // For HTTP test, we can't get the socket event easily.
                // However, `checkSession` returns the session. Does it return the token? No.
                // The token is generated and sent via socket "session_approved". 
                // Or maybe the initial request returns it? No.
                // Ah, looking at `sessionController.js` `approveSession`:
                // It emits `table_${tableId}:session_approved` with `{ token }`.
                // It does NOT return it in the API response.

                // CRITICAL: We can't easily get the customer token in this script without connecting to socket.
                // OR we can hack it by generating a token if we have the secret (we don't easily here).
                // OR we can just use the admin token to place order? No, placeOrder checks `role === 'customer'`.

                // Workaround: We will skip "Placing Order" as customer if we can't get token.
                // But we need an order to test admin actions.
                // Maybe we can insert via SQL? Or just trust the frontend works and testing admin actions on *existing* orders (if any).

                // Let's try to get a token by cheating? 
                // Actually, `checkSession` returns the session object. 
                // `sessionController.js` doesn't expose token there.

                // Alternative: Use a known valid customer token if stable? No.

                // OK, simpler plan: 
                // Just use SQL to insert an order, then test API to update it.
            }
        });

        // Use SQL to insert a dummy order for testing admin actions
        // actually `placeOrder` logic is complex (transaction, products). SQL insert is tedious.
        // Let's try to "login" as a "customer"? No endpoint for that.

        // Wait! The user reported that "Admin can not reject".
        // The issue was missing frontend logic.
        // I have implemented the frontend logic.
        // The verification should be: "Can I call PATCH /orders/:id/status successfully?"

        // I will assume there is at least one order (or I can create one via SQL safely).
        // Let's use `run_command` with psql to insert a dummy order linked to session 1 (if exists).

    } catch (e) {
        console.error(e);
    }
};
// script abandoned
