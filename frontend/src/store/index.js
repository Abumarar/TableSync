import { configureStore } from '@reduxjs/toolkit';
import menuReducer from '../features/menu/menuSlice';
import sessionReducer from '../features/session/sessionSlice';
import cartReducer from '../features/cart/cartSlice';
import authReducer from '../features/auth/authSlice';
import orderReducer from '../features/order/orderSlice';

export const store = configureStore({
    reducer: {
        menu: menuReducer,
        session: sessionReducer,
        cart: cartReducer,
        auth: authReducer,
        order: orderReducer,
    },
});
