import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/app-colors';

type Props = {
  size?: number;
  initials?: string;
  background?: string;
  foreground?: string;
};

export function Avatar({ size = 40, initials, background, foreground }: Props) {
  const bg = background ?? AppColors.primaryLight;
  const fg = foreground ?? AppColors.primary;

  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}>
      {initials ? (
        <Text style={[styles.initials, { color: fg, fontSize: size * 0.38 }]}>{initials}</Text>
      ) : (
        <Ionicons name="person" size={size * 0.5} color={fg} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '800',
  },
});
