import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/ui/avatar';
import { AppColors, Spacing } from '@/constants/app-colors';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutUser } from '@/store/slices/authSlice';

/**
 * react-native-web does not implement Alert.alert() (it's a documented no-op
 * on web), so the confirm dialog would silently never appear and the
 * onPress callbacks — including the actual logout — would never fire.
 * window.confirm() is used as the web fallback so the button works there too.
 */
function confirmLogout(onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm('Are you sure you want to log out?')) {
      onConfirm();
    }
    return;
  }

  Alert.alert('Log Out', 'Are you sure you want to log out?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Log Out', style: 'destructive', onPress: onConfirm },
  ]);
}

interface StickyHeaderProps {
  title: string;
  showAvatar?: boolean;
  showLogout?: boolean;
  showBack?: boolean;
}

export function StickyHeader({ 
  title, 
  showAvatar = true, 
  showLogout = true,
  showBack = false 
}: StickyHeaderProps) {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const handleLogout = () => {
    confirmLogout(async () => {
      await dispatch(logoutUser());
      router.replace('/login');
    });
  };

  const goToProfile = () => {
    router.push('/profile');
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {showBack && (
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={AppColors.text} />
          </Pressable>
        )}
        <Image
          source={require('@/assets/images/kharch-logo.jpg')}
          style={styles.logo}
          resizeMode="cover"
        />
        {showAvatar && (
          <Pressable onPress={goToProfile} style={styles.avatarPress}>
            <Avatar size={40} initials={initials} />
          </Pressable>
        )}
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      {showLogout && (
        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color={AppColors.danger} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    backgroundColor: AppColors.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    zIndex: 100,
    position: 'sticky',
    top: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: AppColors.text,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
});