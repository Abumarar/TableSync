import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeFromCart, clearCart, updateCartItemNote } from '../features/cart/cartSlice';
import { requestSession } from '../features/session/sessionSlice';
import { placeOrder } from '../features/order/orderSlice';
import { X, Trash2 } from 'lucide-react';
import Button from './ui/Button';

const CartDrawer = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const cartItems = useSelector((state) => state.cart.items);
    const { status, tableId } = useSelector((state) => state.session);
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
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-in">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <h2 className="text-xl font-heading font-bold text-gray-900">Your Order</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    {orderPlaced ? (
                        <div className="text-center py-10">
                            <div className="bg-green-100 text-green-800 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                                <span className="text-3xl">✓</span>
                            </div>
                            <h3 className="text-2xl font-heading font-bold mb-2 text-gray-900">Order Placed!</h3>
                            <p className="text-gray-500 mb-8">The kitchen has received your order.</p>
                            <Button onClick={onClose} width="full">
                                Back to Menu
                            </Button>
                        </div>
                    ) : cartItems.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-4xl">🛒</span>
                            </div>
                            <p className="font-medium text-lg">Your cart is empty.</p>
                            <button onClick={onClose} className="mt-4 text-primary font-bold hover:underline">Start adding items</button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {cartItems.map((item, index) => (
                                <div key={index} className="flex flex-col border-b border-gray-100 pb-6 last:border-0">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1 pr-4">
                                            <h3 className="font-bold text-gray-800 text-lg leading-snug">{item.name}</h3>
                                            <div className="text-sm text-gray-500 mt-1">
                                                {item.quantity} x ${item.price}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-3">
                                            <span className="font-bold text-gray-900 text-lg py-1">${(item.price * item.quantity).toFixed(2)}</span>
                                            <button
                                                onClick={() => dispatch(removeFromCart(index))}
                                                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors group"
                                                title="Remove item"
                                            >
                                                <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Add a note (e.g., no sugar)"
                                        className="text-sm border border-gray-200 rounded-lg p-2.5 w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-gray-400"
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
                    <div className="p-6 border-t border-gray-100 bg-gray-50 safe-area-bottom">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-gray-500 font-medium">Total</span>
                            <span className="text-3xl font-heading font-bold text-gray-900">${total.toFixed(2)}</span>
                        </div>

                        {status === 'pending' || waitingForApproval ? (
                            <div className="w-full bg-yellow-100 text-yellow-800 py-4 rounded-xl font-bold text-center animate-pulse border border-yellow-200">
                                Waiting for staff approval...
                            </div>
                        ) : showNameInput ? (
                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
                                <input
                                    type="text"
                                    placeholder="Enter your name to continue"
                                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex gap-3">
                                    <Button
                                        variant="ghost"
                                        width="full"
                                        onClick={() => setShowNameInput(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="primary"
                                        width="full"
                                        onClick={handleRequestAndPlaceOrder}
                                        disabled={!customerName.trim()}
                                    >
                                        Send Request
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                variant={status === 'active' ? 'primary' : 'primary'} // Visual preference
                                width="full"
                                size="lg"
                                onClick={() => {
                                    if (status === 'active') {
                                        handlePlaceOrder();
                                    } else {
                                        setShowNameInput(true);
                                    }
                                }}
                                isLoading={loading}
                            >
                                {status === 'active' ? 'Place Order' : 'Review & Request'}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartDrawer;

