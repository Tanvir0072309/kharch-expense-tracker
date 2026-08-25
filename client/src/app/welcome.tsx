import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { LogoLockup } from '@/components/ui/app-logo';
import { WalletIllustration } from '@/components/ui/wallet-illustration';
import { Spacing } from '@/constants/app-colors';

export default function WelcomeScreen() {
  return (
    <LinearGradient colors={['#6C4CE0', '#8F6CFF']} style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe}>
        <LogoLockup size={34} light />

        <View style={styles.illustrationWrap}>
          <WalletIllustration size={220} />
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.title}>Save your money with{'\n'}Expense Tracker</Text>
          <Text style={styles.subtitle}>
            Track every rupee, spot your spending habits, and grow your savings — all in one
            simple app.
          </Text>
        </View>

        <View style={styles.actions}>
          <AppButton title="Let's Start" onPress={() => router.push('/signup')} />
          <AppButton
            title="I already have an account"
            variant="ghost"
            onPress={() => router.push('/login')}
            style={styles.loginLink}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
    justifyContent: 'space-between',
    paddingBottom: Spacing.xl,
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  textBlock: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: Spacing.md,
  },
  actions: {
    gap: Spacing.sm,
  },
  loginLink: {
    height: 44,
  },
});
