import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        items: [], // { productId, quantity, notes, name, price }
    },
    reducers: {
        addToCart: (state, action) => {
            const { product, quantity, notes } = action.payload;
            // Always add as new item to allow distinct notes for same product
            state.items.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity,
                notes: notes || ''
            });
        },
        removeFromCart: (state, action) => {
            // Remove by index
            state.items.splice(action.payload, 1);
        },
        updateCartItemNote: (state, action) => {
            const { index, note } = action.payload;
            if (state.items[index]) {
                state.items[index].notes = note;
            }
        },
        clearCart: (state) => {
            state.items = [];
        }
    },
});

export const { addToCart, removeFromCart, updateCartItemNote, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
