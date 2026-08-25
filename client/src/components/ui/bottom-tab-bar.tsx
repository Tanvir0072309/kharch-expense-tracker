import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/app-colors';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  home: 'home',
  expenses: 'wallet',
  analytics: 'pie-chart',
  profile: 'person',
};

export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const routes = state.routes;
  // Split the 4 real tabs around the center "+" action button.
  const left = routes.slice(0, 2);
  const right = routes.slice(2);

  const renderItem = (route: (typeof routes)[number]) => {
    const isFocused = state.index === routes.indexOf(route);
    const iconName = ICONS[route.name] ?? 'ellipse';

    return (
      <Pressable
        key={route.key}
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }}
        style={styles.tabItem}>
        <Ionicons
          name={isFocused ? iconName : (`${iconName}-outline` as keyof typeof Ionicons.glyphMap)}
          size={23}
          color={isFocused ? AppColors.primary : AppColors.textFaint}
        />
      </Pressable>
    );
  };

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      <View style={styles.row}>
        {left.map(renderItem)}
        <Pressable onPress={() => router.push('/add-transaction')} style={styles.fab}>
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
        {right.map(renderItem)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: AppColors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  tabItem: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    shadowColor: AppColors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
