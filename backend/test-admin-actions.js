const API_URL = 'http://localhost:5000/api';

const runTest = async () => {
    try {
        console.log('Logging in as admin...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;

        // Assuming Order ID 1 exists (from previous insert or existing data)
        const orderId = 1;
        console.log(`Updating Order ${orderId} to 'preparing'...`);

        const updateRes = await fetch(`${API_URL}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'preparing' })
        });

        if (updateRes.ok) {
            console.log('Update successful:', await updateRes.json());
        } else {
            console.error('Update failed:', updateRes.status, await updateRes.text());
        }

        console.log(`Rejecting Order ${orderId}...`);
        const rejectRes = await fetch(`${API_URL}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'cancelled' })
        });

        if (rejectRes.ok) {
            console.log('Reject successful:', await rejectRes.json());
        } else {
            console.error('Reject failed:', rejectRes.status, await rejectRes.text());
        }


    } catch (e) {
        console.error(e);
    }
};

runTest();
