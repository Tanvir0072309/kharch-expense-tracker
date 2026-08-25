import { configureStore } from '@reduxjs/toolkit';

import authReducer, { attachAuthLogoutHandler } from '@/store/slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Add more feature slices here as the app grows, e.g.:
    // transactions: transactionsReducer,
  },
});

// Let the centralized axios client (client.ts) trigger a Redux logout
// when a token refresh fails, without creating a circular import.
attachAuthLogoutHandler(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
