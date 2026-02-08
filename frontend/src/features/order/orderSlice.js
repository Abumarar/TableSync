import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchSessionOrders = createAsyncThunk('order/fetchSessionOrders', async (sessionId) => {
    const response = await api.get(`/orders/session/${sessionId}`);
    return response.data;
});

export const placeOrder = createAsyncThunk('order/placeOrder', async (payload) => {
    const response = await api.post('/orders', payload, { useCustomerToken: true });
    return response.data;
});

const orderSlice = createSlice({
    name: 'order',
    initialState: {
        orders: [],
        loading: false,
        error: null,
    },
    reducers: {
        updateOrder: (state, action) => {
            const { orderId, status } = action.payload;
            const order = state.orders.find(o => o.id === orderId);
            if (order) {
                order.status = status;
            }
        },
        addOrder: (state, action) => {
            state.orders.unshift(action.payload);
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSessionOrders.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchSessionOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.orders = action.payload;
            })
            .addCase(fetchSessionOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(placeOrder.fulfilled, (state, action) => {
                state.orders.push(action.payload);
            });
    },
});


export const { updateOrder, addOrder } = orderSlice.actions;
export default orderSlice.reducer;
