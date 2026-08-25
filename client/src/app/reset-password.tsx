import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppTextInput } from '@/components/ui/app-text-input';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppColors, Spacing } from '@/constants/app-colors';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearAuthError, resetPassword } from '@/store/slices/authSlice';

export default function ResetPasswordScreen() {
  const { email, otp } = useLocalSearchParams<{ email?: string; otp?: string }>();
  const dispatch = useAppDispatch();
  const { loading, error: serverError } = useAppSelector((state) => state.auth);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleReset = async () => {
    const next: Record<string, string> = {};
    if (password.length < 6) next.password = 'Password must be at least 6 characters';
    if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (!email || !otp) {
      Alert.alert('Session expired', 'Please restart the password reset process.');
      router.replace('/forgot-password');
      return;
    }

    dispatch(clearAuthError());
    const result = await dispatch(resetPassword({ email, otp, password }));
    if (resetPassword.fulfilled.match(result)) {
      Alert.alert('Success', 'Your password has been reset. Please log in.');
      router.replace('/login');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <ScreenHeader onBack={() => router.back()} />

        <Text style={styles.title}>Set new password</Text>
        <Text style={styles.subtitle}>
          Your new password must be different from previously used passwords.
        </Text>

        <AppTextInput
          label="New password"
          placeholder="Enter new password"
          value={password}
          onChangeText={setPassword}
          icon="lock-closed-outline"
          secure
          error={errors.password}
        />
        <AppTextInput
          label="Confirm password"
          placeholder="Re-enter new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          icon="lock-closed-outline"
          secure
          error={errors.confirmPassword}
        />

        {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}

        <AppButton title="Reset Password" onPress={handleReset} loading={loading} />
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
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: AppColors.text,
    marginTop: Spacing.lg,
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
});
