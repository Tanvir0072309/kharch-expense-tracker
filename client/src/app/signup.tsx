import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppTextInput } from '@/components/ui/app-text-input';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppColors, Spacing } from '@/constants/app-colors';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearAuthError, signup } from '@/store/slices/authSlice';

export default function SignupScreen() {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Please enter your full name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email address';
    if (password.length < 6) next.password = 'Password must be at least 6 characters';
    if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    dispatch(clearAuthError());

    const result = await dispatch(signup({ name, email, password }));
    if (signup.fulfilled.match(result)) {
      router.push({ pathname: '/otp-verification', params: { email, mode: 'signup' } });
    } else {
      Alert.alert('Signup failed', (result.payload as string) || 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <ScreenHeader onBack={() => router.back()} />

          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Sign up to start tracking your expenses</Text>

          <View style={styles.form}>
            <AppTextInput
              label="Full name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              icon="person-outline"
              autoCapitalize="words"
              error={errors.name}
            />
            <AppTextInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              icon="mail-outline"
              keyboardType="email-address"
              error={errors.email}
            />
            <AppTextInput
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              icon="lock-closed-outline"
              secure
              error={errors.password}
            />
            <AppTextInput
              label="Confirm password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              icon="lock-closed-outline"
              secure
              error={errors.confirmPassword}
            />
          </View>

          {error ? <Text style={styles.serverError}>{error}</Text> : null}

          <AppButton title="Sign Up" onPress={handleSignup} loading={loading} />

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Text style={styles.footerLink} onPress={() => router.replace('/login')}>
              Log in
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
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
  },
  form: {
    marginBottom: Spacing.sm,
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
