import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const loginStaff = createAsyncThunk('auth/login', async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
});

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null, // { id, username, role }
        token: localStorage.getItem('authToken') || null,
        loading: false,
        error: null,
    },
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            localStorage.removeItem('authToken');
        },
        setUser: (state, action) => {
            state.user = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginStaff.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginStaff.fulfilled, (state, action) => {
                state.loading = false;
                state.token = action.payload.token;
                state.user = action.payload.user;
                localStorage.setItem('authToken', action.payload.token);
            })
            .addCase(loginStaff.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;
