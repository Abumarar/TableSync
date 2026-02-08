import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { socket } from '../../services/socket';

export const requestSession = createAsyncThunk('session/request', async ({ tableId, customerName }, { rejectWithValue }) => {
    try {
        const response = await api.post('/sessions/request', { tableId, customerName });
        return response.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
});

// Define checkSession before it's used in extraReducers
export const checkSession = createAsyncThunk('session/check', async (tableId) => {
    const response = await api.get(`/sessions/table/${tableId}`);
    return response.data;
});

const sessionSlice = createSlice({
    name: 'session',
    initialState: {
        sessionId: null,
        tableId: null,
        status: 'idle', // idle, pending, active, closed
        token: localStorage.getItem('sessionToken') || null,
        error: null,
    },
    reducers: {
        setSessionToken: (state, action) => {
            state.token = action.payload;
            localStorage.setItem('sessionToken', action.payload);
        },
        setSessionStatus: (state, action) => {
            state.status = action.payload;
        },
        setTableId: (state, action) => {
            state.tableId = action.payload;
        },
        setSessionClosed: (state) => {
            state.status = 'closed';
            state.token = null;
            localStorage.removeItem('sessionToken');
        },
        clearSession: (state) => {
            state.sessionId = null;
            state.status = 'idle';
            state.token = null;
            localStorage.removeItem('sessionToken');
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(requestSession.pending, (state) => {
                state.status = 'requesting';
            })
            .addCase(requestSession.fulfilled, (state, action) => {
                state.status = 'pending';
                state.sessionId = action.payload.id;
                state.tableId = action.payload.table_id;
            })
            .addCase(requestSession.rejected, (state, action) => {
                state.status = 'idle';
                state.error = action.payload || action.error.message;
            })
            .addCase(checkSession.fulfilled, (state, action) => {
                if (action.payload) {
                    state.status = action.payload.status;
                    state.sessionId = action.payload.id;
                    state.tableId = action.payload.table_id;
                    // If session requires token and we don't have one, we might need to handle it?
                    // For now, let's assume if active, they can proceed or will get token somehow
                } else {
                    state.status = 'idle';
                }
            });
    },
});



export const { setSessionToken, setSessionStatus, setTableId, clearSession, setSessionClosed } = sessionSlice.actions;

export default sessionSlice.reducer;
