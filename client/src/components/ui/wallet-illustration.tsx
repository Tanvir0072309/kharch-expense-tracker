import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export function WalletIllustration({ size = 220 }: { size?: number }) {
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View style={[styles.ringOuter, { width: size, height: size, borderRadius: size / 2 }]} />
      <View
        style={[
          styles.ringInner,
          { width: size * 0.82, height: size * 0.82, borderRadius: (size * 0.82) / 2 },
        ]}
      />
      <Svg width={size * 0.56} height={size * 0.56} viewBox="0 0 100 100" fill="none">
        {/* Back card */}
        <Rect x="10" y="30" width="70" height="46" rx="10" fill="rgba(255,255,255,0.35)" />
        {/* Front card */}
        <Rect x="20" y="18" width="70" height="46" rx="10" fill="#FFFFFF" />
        <Rect x="20" y="18" width="70" height="14" rx="10" fill="#FFC542" />
        <Circle cx="70" cy="52" r="10" fill="#FF7A45" />
        <Path
          d="M66 52H74M70 48V56"
          stroke="#FFFFFF"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <Rect x="28" y="46" width="24" height="4" rx="2" fill="#E4DEFB" />
        <Rect x="28" y="54" width="18" height="4" rx="2" fill="#E4DEFB" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuter: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  ringInner: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});
