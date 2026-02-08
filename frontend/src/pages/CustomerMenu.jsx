import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMenu } from '../features/menu/menuSlice';
import { setSessionStatus, setSessionToken, setTableId, checkSession, setSessionClosed } from '../features/session/sessionSlice';
import { fetchSessionOrders, updateOrder } from '../features/order/orderSlice';
import { connectSocket, socket, disconnectSocket } from '../services/socket';
import { ShoppingCart, XCircle, Search, Utensils } from 'lucide-react';
import CartDrawer from '../components/CartDrawer';
import { addToCart } from '../features/cart/cartSlice';

// New Components
import CategoryNav from '../components/Menu/CategoryNav';
import MenuItemCard from '../components/Menu/MenuItemCard';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const CustomerMenu = () => {
    const { tableId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { categories, loading, error } = useSelector((state) => state.menu);
    const { status } = useSelector((state) => state.session);
    const cartItems = useSelector((state) => state.cart.items);
    const { orders } = useSelector((state) => state.order);

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState(null);
    const categoryRefs = useRef({});

    // --- Effects & Logic (Kept mostly same) ---

    useEffect(() => {
        dispatch(setTableId(tableId));
        dispatch(fetchMenu());

        dispatch(checkSession(tableId)).unwrap().then((session) => {
            if (session && (session.status === 'active' || session.status === 'pending')) {
                dispatch(fetchSessionOrders(session.id));
            }
        });

        connectSocket();
        socket.emit('join_table', tableId);

        socket.on(`table_${tableId}:session_approved`, (data) => {
            dispatch(setSessionToken(data.token));
            dispatch(setSessionStatus('active'));
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

    // Redirect if session is closed or rejected
    useEffect(() => {
        if (status === 'closed' || status === 'rejected') {
            navigate('/');
        }
    }, [status, navigate]);

    // Construct scroll spy for active category
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 150; // Offset for header
            let currentCategory = null;

            categories.forEach((cat) => {
                const element = document.getElementById(`category-${cat.id}`);
                if (element && element.offsetTop <= scrollPosition) {
                    currentCategory = cat.id;
                }
            });

            if (currentCategory && currentCategory !== activeCategory) {
                setActiveCategory(currentCategory);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [categories, activeCategory]);


    const handleCategorySelect = (categoryId) => {
        setActiveCategory(categoryId);
        const element = document.getElementById(`category-${categoryId}`);
        if (element) {
            const offset = 100; // Header height
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    const handleAddToCart = (product, quantity) => {
        dispatch(addToCart({ product, quantity, notes: '' }));
        // Could add a toast notification here
    };

    // --- Render Helpers ---



    if (orders.length > 0) {
        // Keeping the order status view simple for now as requested, just styled better
        return (
            <div className="min-h-screen bg-neutral-50 p-6">
                <div className="max-w-md mx-auto pt-10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-heading font-bold text-gray-900">Order Status</h1>
                        <p className="text-gray-500">Table {tableId}</p>
                    </div>
                    <div className="space-y-6">
                        {orders.map(order => (
                            <div key={order.id} className="bg-white p-6 rounded-xl shadow-card border border-gray-100">
                                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                                    <span className="font-bold text-lg text-gray-800">Order #{order.id}</span>
                                    <Badge variant={order.status === 'ready' ? 'success' : 'default'} className="uppercase">
                                        {order.status}
                                    </Badge>
                                </div>
                                <div className="space-y-3">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-gray-700">
                                            <div className="flex gap-3">
                                                <span className="font-bold text-primary">{item.quantity}x</span>
                                                <span>{item.name || item.productName}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-4 mt-4 border-t border-gray-100 flex justify-between items-center">
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
        <div className="min-h-screen bg-neutral-50 pb-24">
            {/* Top Header */}
            <header className="bg-white sticky top-0 z-30 shadow-sm">
                <div className="px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <Utensils className="text-primary" size={20} />
                        </div>
                        <div>
                            <h1 className="font-heading font-bold text-lg leading-none text-gray-900">TableSync</h1>
                            <span className="text-xs text-gray-500">Table {tableId}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {status === 'pending' && <Badge variant="warning">Pending Approval</Badge>}
                        {status === 'active' && <Badge variant="success">Ordering Active</Badge>}
                    </div>
                </div>

                {/* Category Navigation */}
                {!loading && !error && (
                    <CategoryNav
                        categories={categories}
                        activeCategory={activeCategory}
                        onSelectCategory={handleCategorySelect}
                    />
                )}
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-6">
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        <p className="mt-4 text-gray-500">Loading menu...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
                        <p>Error loading menu: {error}</p>
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => dispatch(fetchMenu())}>Retry</Button>
                    </div>
                )}

                {!loading && !error && categories.map(category => (
                    <div key={category.id} id={`category-${category.id}`} className="mb-10 scroll-mt-36">
                        <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4 px-1">{category.name}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                            {category.products.map(product => (
                                <MenuItemCard
                                    key={product.id}
                                    product={product}
                                    onAdd={handleAddToCart}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </main>

            {/* Pending State Banner */}
            {status === 'pending' && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-yellow-50 border-t border-yellow-200 z-40 text-center shadow-lg">
                    <p className="text-yellow-800 font-semibold text-sm">Waiting for staff to approve your session...</p>
                </div>
            )}

            {/* Float Cart Button */}
            {cartItems.length > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-sm px-4">
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="w-full bg-gray-900 text-white p-4 rounded-2xl shadow-floating flex justify-between items-center hover:scale-[1.02] transition-transform active:scale-95"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 px-3 py-1 rounded-lg font-bold">
                                {cartItems.length}
                            </div>
                            <span className="font-medium">View your order</span>
                        </div>
                        <div className="font-bold flex items-center gap-2">
                            Pre-Total <ShoppingCart size={20} />
                        </div>
                    </button>
                </div>
            )}

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    );
};

export default CustomerMenu;
