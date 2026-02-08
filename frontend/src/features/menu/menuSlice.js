import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchMenu = createAsyncThunk('menu/fetchMenu', async () => {
    const response = await api.get('/menu');
    return response.data;
});

const menuSlice = createSlice({
    name: 'menu',
    initialState: {
        categories: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchMenu.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchMenu.fulfilled, (state, action) => {
                state.loading = false;
                state.categories = action.payload;
            })
            .addCase(fetchMenu.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    },
});

export default menuSlice.reducer;
