import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { OtpInput } from '@/components/ui/otp-input';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppColors, Spacing } from '@/constants/app-colors';
import { ResendOtpType } from '@/api/authApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearAuthError,
  resendOtp,
  verifyLoginOtp,
  verifyResetOtp,
  verifySignupOtp,
} from '@/store/slices/authSlice';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

type Mode = 'signup' | 'login' | 'reset';

export default function OtpVerificationScreen() {
  const { email, mode } = useLocalSearchParams<{ email?: string; mode?: string }>();
  const resolvedMode: Mode = (mode as Mode) || 'signup';

  const dispatch = useAppDispatch();
  const { loading, resending, error } = useAppSelector((state) => state.auth);

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const code = otp.join('');

  const handleResend = async () => {
    if (secondsLeft > 0 || !email) return;
    dispatch(clearAuthError());

    const typeMap: Record<Mode, ResendOtpType> = {
      signup: 'signup',
      login: 'login',
      reset: 'reset',
    };

    const result = await dispatch(resendOtp({ email, type: typeMap[resolvedMode] }));
    if (resendOtp.fulfilled.match(result)) {
      setOtp(Array(OTP_LENGTH).fill(''));
      setSecondsLeft(RESEND_SECONDS);
    }
  };

  const handleVerify = async () => {
    if (!email || code.length < OTP_LENGTH) return;
    dispatch(clearAuthError());

    if (resolvedMode === 'signup') {
      const result = await dispatch(verifySignupOtp({ email, otp: code }));
      if (verifySignupOtp.fulfilled.match(result)) {
        router.replace('/home');
      }
      return;
    }

    if (resolvedMode === 'login') {
      const result = await dispatch(verifyLoginOtp({ email, otp: code }));
      if (verifyLoginOtp.fulfilled.match(result)) {
        router.replace('/home');
      }
      return;
    }

    // reset mode
    const result = await dispatch(verifyResetOtp({ email, otp: code }));
    if (verifyResetOtp.fulfilled.match(result)) {
      router.push({ pathname: '/reset-password', params: { email, otp: code } });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <ScreenHeader onBack={() => router.back()} />

        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>
          We've sent a {OTP_LENGTH}-digit code to{'\n'}
          <Text style={styles.email}>{email || 'your email address'}</Text>
        </Text>

        <OtpInput length={OTP_LENGTH} value={otp} onChange={setOtp} />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AppButton title="Verify" onPress={handleVerify} loading={loading} />

        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          <Text
            onPress={handleResend}
            style={[styles.resendLink, (secondsLeft > 0 || resending) && styles.resendLinkDisabled]}>
            {resending ? 'Sending...' : secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend OTP'}
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
    lineHeight: 20,
  },
  email: {
    color: AppColors.text,
    fontWeight: '700',
  },
  error: {
    color: AppColors.danger,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  resendText: {
    color: AppColors.textMuted,
    fontSize: 14,
  },
  resendLink: {
    color: AppColors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  resendLinkDisabled: {
    color: AppColors.textFaint,
  },
});
