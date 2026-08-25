import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { AppColors, Radius, Spacing } from '@/constants/app-colors';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCurrentUser, logoutUser, updateProfile } from '@/store/slices/authSlice';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

type MenuItem = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  content: string;
};

// Main Menu Items
const MENU_ITEMS: MenuItem[] = [
  {
    key: 'security',
    icon: 'shield-checkmark-outline',
    label: 'Security & Privacy',
    content:
      'Your data is protected with encrypted sessions and secure token-based authentication. You can log out of this device at any time from below.',
  },
  {
    key: 'support',
    icon: 'help-circle-outline',
    label: 'Help & Support',
    content: `Need help? Reach us at support@kharch.com.\n\nApp Version: ${APP_VERSION}`,
  },
];

// Additional Info Items
const INFO_ITEMS: MenuItem[] = [
  {
    key: 'about',
    icon: 'information-circle-outline',
    label: 'About Kharch',
    content: 'Kharch is a personal finance management app that helps you track your expenses and income effortlessly. Stay on top of your finances with real-time insights.',
  },
  {
    key: 'features',
    icon: 'apps-outline',
    label: 'Features',
    content: '• Track Expenses & Income\n• Monthly Analytics\n• Budget Management\n• Category-wise Spending\n• Transaction History\n• Secure Authentication',
  },
  {
    key: 'privacy',
    icon: 'lock-closed-outline',
    label: 'Privacy Policy',
    content: 'We take your privacy seriously. Your data is encrypted and stored securely. We never share your personal information with third parties.',
  },
  {
    key: 'terms',
    icon: 'document-text-outline',
    label: 'Terms of Service',
    content: 'By using Kharch, you agree to our terms of service. All transactions are encrypted and stored securely. We reserve the right to update these terms.',
  },
];

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state) => state.auth);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(user?.name ?? '');

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  useEffect(() => {
    if (!isEditing) setNameDraft(user?.name ?? '');
  }, [user?.name, isEditing]);

  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  const toggleExpand = (key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  const handleSaveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === user?.name) {
      setIsEditing(false);
      return;
    }
    const result = await dispatch(updateProfile({ name: trimmed }));
    if (updateProfile.fulfilled.match(result)) {
      setIsEditing(false);
    } else {
      Alert.alert('Could not update name', (result.payload as string) || 'Please try again.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out', 
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await dispatch(logoutUser());
            router.replace('/login');
          },
        },
      ]
    );
  };

  // Combine all menu items
  const allMenuItems = [...MENU_ITEMS, ...INFO_ITEMS];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Profile</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Avatar size={84} initials={initials} />
          {isEditing ? (
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Your name"
              placeholderTextColor={AppColors.textFaint}
              style={styles.nameInput}
              autoFocus
              editable={!loading}
            />
          ) : (
            <Text style={styles.name}>{user?.name || 'User'}</Text>
          )}
          <Text style={styles.email}>{user?.email || ''}</Text>

          {isEditing ? (
            <View style={styles.editActionsRow}>
              <Pressable
                style={[styles.editBtn, styles.editBtnGhost]}
                onPress={() => setIsEditing(false)}
                disabled={loading}>
                <Text style={styles.editBtnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.editBtn} onPress={handleSaveName} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color={AppColors.primary} />
                ) : (
                  <Text style={styles.editBtnText}>Save</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.editBtn} onPress={() => setIsEditing(true)}>
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </Pressable>
          )}
        </View>

        {/* Menu Items with Dropdowns */}
        <View style={styles.menuCard}>
          {allMenuItems.map((item, index) => {
            const isOpen = expandedKey === item.key;
            const isLast = index === allMenuItems.length - 1;
            return (
              <View
                key={item.key}
                style={[
                  !isLast && !isOpen ? styles.menuRowBorder : undefined,
                  isOpen && styles.menuItemOpen,
                ]}>
                <Pressable style={styles.menuRow} onPress={() => toggleExpand(item.key)}>
                  <View style={styles.menuIconWrap}>
                    <Ionicons name={item.icon} size={18} color={AppColors.primary} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={AppColors.textFaint}
                  />
                </Pressable>
                {isOpen ? (
                  <View style={styles.menuContent}>
                    <Text style={styles.menuContentText}>{item.content}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* Logout Button */}
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={AppColors.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

        {/* Version Info */}
        <Text style={styles.versionText}>Version {APP_VERSION}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scroll: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: AppColors.text,
    paddingVertical: Spacing.lg,
  },
  profileCard: {
    backgroundColor: AppColors.card,
    borderRadius: Radius.xl,
    alignItems: 'center',
    padding: Spacing.xl,
  },
  name: {
    marginTop: Spacing.md,
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.text,
  },
  email: {
    fontSize: 13,
    color: AppColors.textMuted,
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  nameInput: {
    marginTop: Spacing.md,
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.text,
    textAlign: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: AppColors.primary,
    minWidth: 160,
    paddingVertical: 2,
  },
  editActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  editBtn: {
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 8,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    color: AppColors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  editBtnGhost: {
    borderColor: AppColors.border,
  },
  editBtnGhostText: {
    color: AppColors.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  menuCard: {
    backgroundColor: AppColors.card,
    borderRadius: Radius.xl,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    overflow: 'hidden',
  },
  menuItemOpen: {
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text,
  },
  menuContent: {
    paddingBottom: 16,
    paddingRight: 4,
    paddingLeft: 50,
  },
  menuContentText: {
    fontSize: 13,
    color: AppColors.textMuted,
    lineHeight: 20,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.xl,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    backgroundColor: AppColors.dangerLight,
  },
  logoutText: {
    color: AppColors.danger,
    fontWeight: '700',
    fontSize: 14,
  },
  versionText: {
    textAlign: 'center',
    color: AppColors.textFaint,
    fontSize: 12,
    marginTop: Spacing.lg,
  },
});