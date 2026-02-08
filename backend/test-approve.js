const API_URL = 'http://localhost:5000/api';

const runTest = async () => {
    try {
        console.log('Logging in as admin...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Got token:', token ? 'YES' : 'NO');

        console.log('Requesting session for table 5...');
        const requestRes = await fetch(`${API_URL}/sessions/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableId: 5, customerName: 'Auth Test User' })
        });

        if (!requestRes.ok) throw new Error(`Request failed: ${requestRes.status}`);
        const requestData = await requestRes.json();
        const sessionId = requestData.id;
        console.log('Created session:', sessionId);

        console.log('Approving session...');
        const approveRes = await fetch(`${API_URL}/sessions/${sessionId}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!approveRes.ok) {
            console.log(`Approval failed status: ${approveRes.status}`);
            const text = await approveRes.text();
            console.log(`Response body: ${text}`);
            throw new Error(`Approval failed: ${approveRes.status}`);
        }

        console.log('Session approved successfully!');

    } catch (error) {
        console.error('Error:', error.message);
    }
};

runTest();
