import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMenu } from '../features/menu/menuSlice';
import { setSessionStatus, setSessionToken, setTableId, checkSession, setSessionClosed } from '../features/session/sessionSlice';
import { fetchSessionOrders, updateOrder } from '../features/order/orderSlice';
import { connectSocket, socket, disconnectSocket } from '../services/socket';
import { ShoppingCart, ClipboardList, XCircle, Minus, Plus } from 'lucide-react';
import CartDrawer from '../components/CartDrawer';
import { addToCart } from '../features/cart/cartSlice';

const ProductItem = ({ product }) => {
    const dispatch = useDispatch();
    const [quantity, setQuantity] = useState(1);

    const handleIncrement = () => setQuantity(prev => prev + 1);
    const handleDecrement = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

    const handleAdd = () => {
        dispatch(addToCart({ product, quantity, notes: '' }));
        setQuantity(1); // Reset after adding
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow flex flex-col gap-3">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-gray-500 text-sm">{product.description}</p>
                    <p className="font-bold mt-2">${product.price}</p>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-2 border-t pt-3">
                <div className="flex items-center border rounded-lg bg-gray-50">
                    <button
                        onClick={handleDecrement}
                        className="p-2 hover:bg-gray-200 rounded-l-lg text-gray-600"
                        disabled={quantity <= 1}
                    >
                        <Minus size={16} />
                    </button>
                    <span className="w-8 text-center font-bold text-gray-800">{quantity}</span>
                    <button
                        onClick={handleIncrement}
                        className="p-2 hover:bg-gray-200 rounded-r-lg text-gray-600"
                    >
                        <Plus size={16} />
                    </button>
                </div>

                <button
                    onClick={handleAdd}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-1"
                >
                    Add
                </button>
            </div>
        </div>
    );
};

const CustomerMenu = () => {
    const { tableId } = useParams();
    const dispatch = useDispatch();
    const { categories, loading, error } = useSelector((state) => state.menu);
    const { status, sessionId } = useSelector((state) => state.session);
    const cart = useSelector((state) => state.cart.items);
    const { orders } = useSelector((state) => state.order);

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isOrdersOpen, setIsOrdersOpen] = useState(false);

    useEffect(() => {
        dispatch(setTableId(tableId)); // Store tableId for CartDrawer to use
        dispatch(fetchMenu());

        // Check for existing session
        dispatch(checkSession(tableId)).unwrap().then((session) => {
            if (session && (session.status === 'active' || session.status === 'pending')) {
                dispatch(fetchSessionOrders(session.id));
            }
        });

        // Connect to socket and join table room
        connectSocket();
        socket.emit('join_table', tableId);

        // Listen for session approval
        socket.on(`table_${tableId}:session_approved`, (data) => {
            dispatch(setSessionToken(data.token));
            dispatch(setSessionStatus('active'));
            // Fetch orders again to be sure or if it was pending
            // We might need sessionId if it wasn't in state yet, but data.token has it? No, data doesn't have id directly usually unless we decode or if checkSession updated it.
            // checkSession update it in redux.
        });

        socket.on(`table_${tableId}:session_closed`, () => {
            dispatch(setSessionClosed());
        });

        socket.on(`table_${tableId}:order_update`, (data) => {
            dispatch(updateOrder(data));
        });

        return () => {
            socket.off(`table_${tableId}:session_approved`);
            socket.off(`table_${tableId}:session_closed`);
            socket.off(`table_${tableId}:order_update`);
            disconnectSocket();
        }
    }, [dispatch, tableId]);

    // Format status for display
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'preparing': return 'bg-blue-100 text-blue-800';
            case 'ready': return 'bg-green-100 text-green-800';
            case 'served': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (status === 'closed') {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle size={32} className="text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Session Ended</h1>
                    <p className="text-gray-600 mb-6">
                        This session has been closed by the staff.
                        Please scan the QR code again to start a new order.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
                    >
                        Refresh / Scan Again
                    </button>
                </div>
            </div>
        );
    }

    // If there are orders, show ONLY the status view as requested ("nothing but it")
    if (orders.length > 0) {
        return (
            <div className="min-h-screen bg-gray-100 p-6">
                <div className="max-w-md mx-auto">
                    <div className="text-center mb-8 mt-10">
                        <h1 className="text-3xl font-bold text-gray-800">Order Status</h1>
                        <p className="text-gray-500 mt-2">Table {tableId}</p>
                    </div>

                    <div className="space-y-6">
                        {orders.map(order => (
                            <div key={order.id} className="bg-white p-6 rounded-xl shadow-lg border-2 border-indigo-50">
                                <div className="flex justify-between items-center mb-4 pb-4 border-b">
                                    <span className="font-bold text-lg text-gray-700">Order #{order.id}</span>
                                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>

                                <div className="space-y-3 mb-6">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-gray-700">
                                            <div className="flex gap-3">
                                                <span className="font-bold text-gray-900">{item.quantity}x</span>
                                                <span>{item.name || item.producName}</span>
                                            </div>
                                            {/* Price is not always available in items depending on fetch, usually in product */}
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 border-t flex justify-between items-center">
                                    <span className="text-gray-500">Total</span>
                                    <span className="text-2xl font-bold text-gray-900">${order.total_amount}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-gray-400 text-sm">Please wait for your order to be served.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white shadow p-4 sticky top-0 z-10 flex justify-between items-center">
                <h1 className="text-xl font-bold">Table {tableId}</h1>
                <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                        {status === 'active' ? 'Ordering Active' : status === 'pending' ? 'Pending Approval' : 'Browse Mode'}
                    </span>
                </div>
            </header>

            {/* Menu Content */}
            <main className="p-4">
                {loading && <p className="text-center text-gray-500">Loading menu...</p>}
                {error && <div className="bg-red-100 text-red-700 p-4 rounded text-center mb-4">Error: {error}</div>}
                {!loading && !error && categories.length === 0 && <p className="text-center text-gray-500">No menu items found.</p>}

                {!loading && !error && categories.map(category => (
                    <div key={category.id} className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">{category.name}</h2>
                        <div className="grid gap-4">
                            {category.products.map(product => (
                                <ProductItem key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                ))
                }
            </main>

            {status === 'pending' && (
                <div className="fixed bottom-0 left-0 right-0 p-16 bg-yellow-50 border-t text-center z-30">
                    <p className="text-yellow-800 font-semibold">Session is pending approval.</p>
                </div>
            )}

            {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex justify-between items-center z-50 shadow-lg">
                    <div>
                        <p className="font-bold">{cart.length} items</p>
                    </div>
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"
                    >
                        <ShoppingCart size={20} /> View Cart
                    </button>
                </div>
            )}

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    );
};

export default CustomerMenu;
