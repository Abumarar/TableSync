import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../features/auth/authSlice';
import api from '../services/api';
import { connectSocket, socket, disconnectSocket } from '../services/socket';
import { LogOut, CheckCircle, XCircle, Clock } from 'lucide-react';

const StaffDashboard = () => {
    const { user, token } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [tables, setTables] = useState([]);
    const [requests, setRequests] = useState([]);
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        if (!token) {
            navigate('/staff/login');
            return;
        }

        // Fetch initial data
        const fetchData = async () => {
            try {
                // Fetch tables to get status
                // For MVP we just assume 10 tables or fetch from API if we had a tables endpoint with status
                // But we can infer status from sessions or keep it simple.
                // Let's rely on socket updates for "Live" status, but we need initial state.
                // We'll create a simple tables list for now.
                const tablesRes = await api.get('/tables');
                setTables(tablesRes.data);

                // Fetch pending sessions (requests) if API supports it, or just wait for socket
                // For now, we wait for socket. Ideally API has GET /sessions?status=pending

                // Fetch active orders
                console.log('Fetching active orders...');
                try {
                    const ordersRes = await api.get('/orders', {
                        params: { status: 'pending,preparing,ready' }
                    });
                    console.log('Orders fetched:', ordersRes.data);
                    setOrders(ordersRes.data);
                } catch (e) {
                    console.error('Failed to fetch orders:', e);
                    alert('Failed to fetch orders: ' + e.message);
                }

                // Fetch pending sessions
                const requestsRes = await api.get('/sessions?status=pending');
                // We need to map the response to match the structure expected by the UI (add sessionId alias if needed, though DB returns id)
                // The UI uses sessionId, tableId, customerName.
                // DB returns id, table_id, customer_name.
                // We should map it.
                const formattedRequests = requestsRes.data.map(r => ({
                    sessionId: r.id,
                    tableId: r.table_id,
                    customerName: r.customer_name,
                    status: r.status
                }));
                setRequests(formattedRequests);

            } catch (err) {
                console.error(err);
            }
        };

        fetchData();

        // Connect Socket
        connectSocket();

        // Join Staff Room
        // Backend handles `socket.on('join_staff')`
        socket.emit('join_staff', token);
        console.log('Emitted join_staff with token:', token);

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            socket.emit('join_staff', token); // Re-join on reconnect
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });

        // Listeners
        socket.on('staff:new_request', (data) => {
            console.log('New request:', data);
            setRequests(prev => [...prev, data]);
            // Update table status locally if needed
            setTables(prev => prev.map(t => t.id == data.tableId ? { ...t, status: 'PENDING', current_session_id: data.sessionId } : t));
        });

        socket.on('staff:new_order', (order) => {
            console.log('New order:', order);
            setOrders(prev => [...prev, order]);
        });

        socket.on('staff:session_update', ({ sessionId, status }) => {
            // Refresh tables?
            // Since we don't have full session list traversing, maybe just re-fetch tables
            api.get('/tables').then(res => setTables(res.data));

            if (status === 'active') {
                setRequests(prev => prev.filter(r => r.sessionId !== sessionId));
            }
        });

        return () => {
            socket.off('staff:new_request');
            socket.off('staff:new_order');
            socket.off('staff:session_update');
            disconnectSocket();
        };

    }, [token, navigate]);

    const handleApprove = async (sessionId) => {
        try {
            await api.post(`/sessions/${sessionId}/approve`);
            // Optimistic update
            setRequests(prev => prev.filter(r => r.sessionId !== sessionId));
            // Force refresh tables to reflect status change
            const tablesRes = await api.get('/tables');
            setTables(tablesRes.data);
        } catch (err) {
            console.error(err);
            alert('Failed to approve session: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleRejectSession = async (sessionId) => {
        if (!window.confirm('Are you sure you want to reject this request?')) return;
        try {
            await api.post(`/sessions/${sessionId}/close`);
            setRequests(prev => prev.filter(r => r.sessionId !== sessionId));
            // Force refresh tables
            const tablesRes = await api.get('/tables');
            setTables(tablesRes.data);
        } catch (err) {
            console.error(err);
            alert('Failed to reject session: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status: newStatus });
            // Optimistic update
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (err) {
            console.error(err);
            alert('Failed to update order: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/staff/login');
    };

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-lg fixed h-full z-10">
                <div className="p-6 border-b">
                    <h1 className="text-2xl font-bold text-gray-800">TableSync</h1>
                    <p className="text-sm text-gray-500">Staff Dashboard</p>
                </div>
                <nav className="p-4">
                    <button className="w-full text-left p-3 rounded bg-blue-50 text-blue-600 font-semibold mb-2">
                        Live Overview
                    </button>
                    {/* Add more nav items later */}
                </nav>
                <div className="absolute bottom-0 w-full p-4 border-t">
                    <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:text-red-800 transition">
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 flex-1 p-8">
                {/* Pending Requests Section */}
                {requests.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4 text-orange-600 flex items-center gap-2">
                            <Clock /> Pending Requests
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {requests.map(req => (
                                <div key={req.sessionId} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500 animate-pulse">
                                    <h3 className="text-lg font-bold">Table {req.tableId}</h3>
                                    <p className="text-gray-600">Customer: {req.customerName || 'Guest'}</p>
                                    <div className="mt-4 flex gap-2">
                                        <button
                                            onClick={() => handleApprove(req.sessionId)}
                                            className="flex-1 bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleRejectSession(req.sessionId)}
                                            className="flex-1 bg-red-100 text-red-600 py-2 rounded font-semibold hover:bg-red-200"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Table Grid */}
                <h2 className="text-xl font-bold mb-4 text-gray-800">Tables Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                    {tables.map(table => (
                        <div key={table.id} className={`p-6 rounded-lg shadow-sm text-center border-2 ${table.current_session_id ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                            }`}>
                            <h3 className="text-2xl font-bold text-gray-700">{table.table_number}</h3>
                            <p className={`text-sm font-semibold mt-2 ${table.current_session_id ? 'text-green-600' : 'text-gray-400'
                                }`}>
                                {table.current_session_id ? 'Occupied' : 'Available'}
                            </p>
                            {table.current_session_id && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRejectSession(table.current_session_id);
                                    }}
                                    className="mt-3 text-xs bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 w-full"
                                >
                                    Reset / Close
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Active Orders */}
                <h2 className="text-xl font-bold mb-4 text-gray-800">Active Orders</h2>
                <div className="grid gap-4">
                    {orders.length === 0 ? <p className="text-gray-500">No active orders.</p> : (
                        orders.map(order => (
                            <div key={order.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-gray-800 text-white px-2 py-1 rounded text-sm font-bold">Table {order.table_id || order.tableId}</span>
                                        <span className="text-gray-500 text-sm font-semibold">(Order #{order.id})</span>
                                        <span className="text-sm px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold uppercase text-xs">{order.status}</span>
                                    </div>
                                    <ul className="text-sm">
                                        {order.items.map((item, idx) => (
                                            <li key={idx} className="flex gap-2">
                                                <span className="font-bold">{item.quantity}x</span>
                                                <span>{item.name || item.producName}</span>
                                                {item.notes && <span className="text-gray-400 italic">({item.notes})</span>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {order.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                                            >
                                                Prepare
                                            </button>
                                            <button
                                                onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                                className="bg-red-100 text-red-600 px-3 py-1 rounded text-sm hover:bg-red-200"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    {order.status === 'preparing' && (
                                        <button
                                            onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                                        >
                                            Ready
                                        </button>
                                    )}
                                    {order.status === 'ready' && (
                                        <button
                                            onClick={() => handleUpdateOrderStatus(order.id, 'served')}
                                            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                                        >
                                            Served
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
};

export default StaffDashboard;
