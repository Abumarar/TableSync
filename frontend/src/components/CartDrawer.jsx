import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeFromCart, clearCart, updateCartItemNote } from '../features/cart/cartSlice';
import { requestSession } from '../features/session/sessionSlice';
import { placeOrder } from '../features/order/orderSlice';
import api from '../services/api';
import { X, Trash2 } from 'lucide-react';

const CartDrawer = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const cartItems = useSelector((state) => state.cart.items);
    const { sessionId, status, tableId } = useSelector((state) => state.session);
    const [loading, setLoading] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);

    // New state for deferred flow
    const [customerName, setCustomerName] = useState('');
    const [showNameInput, setShowNameInput] = useState(false);
    const [waitingForApproval, setWaitingForApproval] = useState(false);

    const total = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

    // Watch for status change to active if we are waiting
    useEffect(() => {
        if (waitingForApproval && status === 'active') {
            handlePlaceOrder();
            setWaitingForApproval(false);
        }
    }, [status, waitingForApproval]);

    const handleRequestAndPlaceOrder = async () => {
        if (!customerName.trim()) return;

        try {
            // 1. Request Session
            await dispatch(requestSession({ tableId, customerName })).unwrap();

            // 2. Set waiting state
            setWaitingForApproval(true);
            setShowNameInput(false);
        } catch (err) {
            console.error('Failed to request session:', err);
            alert(err.message || 'Failed to request session. Table might be occupied.');
        }
    };

    const handlePlaceOrder = async () => {
        setLoading(true);
        try {
            const payload = {
                items: cartItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    notes: item.notes
                }))
            };

            await dispatch(placeOrder(payload)).unwrap();

            // setOrderPlaced(true);
            dispatch(clearCart());
            setCustomerName('');
            // The CustomerMenu will see orders > 0 and switch view, unmounting this drawer.
            onClose();

        } catch (err) {
            console.error(err);
            alert('Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

            <div className="relative bg-white w-full max-w-md h-full shadow-xl flex flex-col animate-slide-in">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold">Your Order</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
                        <X />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {orderPlaced ? (
                        <div className="text-center py-10">
                            <div className="bg-green-100 text-green-800 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">✓</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Order Placed!</h3>
                            <p className="text-gray-600">The kitchen has received your order.</p>
                            <button
                                onClick={onClose}
                                className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold"
                            >
                                Back to Menu
                            </button>
                        </div>
                    ) : cartItems.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            <p>Your cart is empty.</p>
                            <button onClick={onClose} className="mt-4 text-blue-600 font-semibold">Start adding items</button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {cartItems.map((item, index) => (
                                <div key={index} className="flex flex-col border-b pb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-gray-800">{item.name}</h3>
                                            <div className="text-sm text-gray-500">
                                                Qty: {item.quantity} x ${item.price}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                                            <button
                                                onClick={() => dispatch(removeFromCart(index))}
                                                className="text-red-500 hover:bg-red-50 p-1 rounded"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Add a note (e.g., no sugar)"
                                        className="text-sm border rounded p-1 w-full bg-gray-50"
                                        defaultValue={item.notes || ''}
                                        onBlur={(e) => {
                                            dispatch(updateCartItemNote({ index, note: e.target.value }));
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {!orderPlaced && cartItems.length > 0 && (
                    <div className="p-4 border-t bg-gray-50">
                        <div className="flex justify-between items-center mb-4 text-lg font-bold">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>

                        {status === 'pending' || waitingForApproval ? (
                            <div className="w-full bg-yellow-100 text-yellow-800 py-3 rounded-lg font-bold text-center animate-pulse">
                                Waiting for staff approval...
                            </div>
                        ) : showNameInput ? (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    className="w-full border p-2 rounded"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowNameInput(false)}
                                        className="flex-1 py-2 text-gray-600 font-semibold border rounded hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleRequestAndPlaceOrder}
                                        disabled={!customerName.trim()}
                                        className="flex-1 bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        Send Request
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    if (status === 'active') {
                                        handlePlaceOrder();
                                    } else {
                                        setShowNameInput(true);
                                    }
                                }}
                                disabled={loading}
                                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {loading ? 'Placing Order...' : status === 'active' ? 'Place Order' : 'Request & Order'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartDrawer;
