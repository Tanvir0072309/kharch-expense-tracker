import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Provider } from 'react-redux';

import { TransactionsProvider } from '@/context/transactions-context';
import { store } from '@/store';
import { useAppDispatch } from '@/store/hooks';
import { restoreSession } from '@/store/slices/authSlice';

function SessionBootstrapper() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // On app start, check AsyncStorage for a previously saved access token
    // so the user doesn't have to log in again every time they reopen the app.
    dispatch(restoreSession());
  }, [dispatch]);

  return null;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <TransactionsProvider>
        <SessionBootstrapper />
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="login" />
          <Stack.Screen name="otp-verification" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="reset-password" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="add-transaction"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </Stack>
      </TransactionsProvider>
    </Provider>
  );
}
