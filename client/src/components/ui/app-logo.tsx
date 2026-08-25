import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { AppColors } from '@/constants/app-colors';

export function LogoMark({ size = 40, background = '#fff', accent = AppColors.primary }: {
  size?: number;
  background?: string;
  accent?: string;
}) {
  return (
    <View
      style={[
        styles.markWrap,
        { width: size, height: size, borderRadius: size * 0.28, backgroundColor: background },
      ]}>
      <Svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none">
        {/* Wallet body */}
        <Path
          d="M3 7.5C3 6.11929 4.11929 5 5.5 5H17.5C18.8807 5 20 6.11929 20 7.5V16.5C20 17.8807 18.8807 19 17.5 19H5.5C4.11929 19 3 17.8807 3 16.5V7.5Z"
          stroke={accent}
          strokeWidth={1.8}
        />
        {/* Fold flap */}
        <Path d="M3 9.5H16.5C17.8807 9.5 19 10.1 19 11.5V12.5" stroke={accent} strokeWidth={1.8} strokeLinecap="round" />
        {/* Coin / clasp */}
        <Circle cx="16.2" cy="13.7" r="1.9" fill={accent} />
      </Svg>
    </View>
  );
}

export function LogoLockup({ size = 40, light = false }: { size?: number; light?: boolean }) {
  return (
    <View style={styles.lockup}>
      <LogoMark size={size} background={light ? 'rgba(255,255,255,0.16)' : AppColors.primaryLight} accent={light ? '#fff' : AppColors.primary} />
      <Text style={[styles.wordmark, { color: light ? '#fff' : AppColors.text, fontSize: size * 0.42 }]}>
        Expense<Text style={{ color: light ? '#fff' : AppColors.primary, fontWeight: '800' }}>Trackr</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  markWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wordmark: {
    fontWeight: '700',
  },
});
