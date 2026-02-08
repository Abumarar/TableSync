import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { connectSocket, socket, disconnectSocket } from '../services/socket';

const KitchenView = () => {
    const { token } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        if (!token) {
            navigate('/staff/login');
            return;
        }

        const fetchOrders = async () => {
            try {
                const res = await api.get('/orders?status=pending,preparing');
                setOrders(res.data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchOrders();
        connectSocket();
        socket.emit('join_staff', token); // Kitchen joins staff room for now or we create a specific kitchen room

        socket.on('kitchen:new_order', (order) => {
            setOrders(prev => [...prev, order]);
        });

        socket.on('kitchen:order_update', ({ orderId, status }) => {
            if (status === 'ready' || status === 'served') {
                setOrders(prev => prev.filter(o => o.id !== orderId));
            } else {
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
            }
        });

        return () => {
            socket.off('kitchen:new_order');
            socket.off('kitchen:order_update');
            disconnectSocket();
        };
    }, [token, navigate]);

    const updateStatus = async (orderId, status) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-800 text-white p-4">
            <h1 className="text-3xl font-bold mb-6 border-b border-gray-700 pb-4">Kitchen View</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {orders.map(order => (
                    <div key={order.id} className="bg-gray-700 rounded-lg p-6 shadow-xl border border-gray-600 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xl font-bold bg-gray-900 px-3 py-1 rounded">Table {order.table_id}</span>
                                <span className="text-gray-400">#{order.id}</span>
                            </div>
                            <div className="mb-4 space-y-2">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between border-b border-gray-600 pb-2">
                                        <span className="font-bold text-lg text-yellow-400">{item.quantity}x</span>
                                        <span className="flex-1 ml-2 text-lg">{item.producName}</span>
                                    </div>
                                ))}
                            </div>
                            {order.items.some(i => i.notes) && (
                                <div className="bg-red-900/30 p-2 rounded text-sm text-red-200 mb-4">
                                    Notes: {order.items.filter(i => i.notes).map(i => i.notes).join(', ')}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 mt-4">
                            {order.status === 'pending' && (
                                <button
                                    onClick={() => updateStatus(order.id, 'preparing')}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded font-bold text-lg transition"
                                >
                                    Start
                                </button>
                            )}
                            {order.status === 'preparing' && (
                                <button
                                    onClick={() => updateStatus(order.id, 'ready')}
                                    className="flex-1 bg-green-600 hover:bg-green-500 py-3 rounded font-bold text-lg transition"
                                >
                                    Ready
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {orders.length === 0 && (
                <div className="text-center text-gray-500 mt-20 text-2xl">
                    No pending orders
                </div>
            )}
        </div>
    );
};

export default KitchenView;
