import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppTextInput } from '@/components/ui/app-text-input';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppColors, Spacing } from '@/constants/app-colors';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearAuthError, forgotPassword } from '@/store/slices/authSlice';

export default function ForgotPasswordScreen() {
  const dispatch = useAppDispatch();
  const { loading, error: serverError } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address');
      return;
    }
    setError('');
    dispatch(clearAuthError());

    const result = await dispatch(forgotPassword({ email }));
    if (forgotPassword.fulfilled.match(result)) {
      router.push({ pathname: '/otp-verification', params: { email, mode: 'reset' } });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <ScreenHeader onBack={() => router.back()} />

        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed" size={28} color={AppColors.primary} />
        </View>

        <Text style={styles.title}>Forgot password?</Text>
        <Text style={styles.subtitle}>
          Enter the email linked to your account and we'll send you a code to reset your
          password.
        </Text>

        <AppTextInput
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          icon="mail-outline"
          keyboardType="email-address"
          error={error}
        />

        {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}

        <AppButton title="Send OTP" onPress={handleSend} loading={loading} />

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Remembered your password? </Text>
          <Text style={styles.footerLink} onPress={() => router.replace('/login')}>
            Log in
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.sm,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: AppColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: AppColors.text,
  },
  subtitle: {
    fontSize: 14,
    color: AppColors.textMuted,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xxl,
    lineHeight: 20,
  },
  serverError: {
    color: AppColors.danger,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    color: AppColors.textMuted,
    fontSize: 14,
  },
  footerLink: {
    color: AppColors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
