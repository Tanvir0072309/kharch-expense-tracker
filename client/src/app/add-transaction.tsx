import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppColors, Radius, Spacing } from '@/constants/app-colors';
import { getCategoryColor, getCategoryIcon } from '@/constants/category-icon';
import { useTransactions } from '@/context/transactions-context';
import { TransactionType } from '@/types/transaction';

// Extended categories
const EXTRA_CATEGORIES = [
  { id: 100, name: 'Shopping' },
  { id: 101, name: 'Food & Dining' },
  { id: 102, name: 'Transportation' },
  { id: 103, name: 'Entertainment' },
  { id: 104, name: 'Bills & Utilities' },
  { id: 105, name: 'Healthcare' },
  { id: 106, name: 'Education' },
  { id: 107, name: 'Rent' },
  { id: 108, name: 'Insurance' },
  { id: 109, name: 'Salary' },
  { id: 110, name: 'Freelance' },
  { id: 111, name: 'Investments' },
  { id: 112, name: 'Gifts' },
  { id: 113, name: 'Travel' },
  { id: 114, name: 'Groceries' },
  { id: 115, name: 'Dining Out' },
  { id: 116, name: 'Coffee & Snacks' },
  { id: 117, name: 'Clothing' },
  { id: 118, name: 'Electronics' },
  { id: 119, name: 'Home & Furniture' },
  { id: 120, name: 'Personal Care' },
  { id: 121, name: 'Fitness' },
  { id: 122, name: 'Subscriptions' },
  { id: 123, name: 'Taxes' },
  { id: 124, name: 'Emergency' },
];

export default function AddTransactionScreen() {
  const { addTransaction, categories } = useTransactions();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const allCategories = [...categories, ...EXTRA_CATEGORIES];
  const selectedCategory = allCategories.find((c) => c.id === categoryId);

  // ✅ Direct navigation to Home page
  const goToHome = () => {
    router.replace('/(tabs)/home');
  };

  const handleSave = async () => {
    const numericAmount = Number(amount);
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    if (!numericAmount || numericAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await addTransaction({
        title: title.trim(),
        category: selectedCategory?.name ?? (type === 'profit' ? 'Salary' : 'Other'),
        amount: numericAmount,
        type,
        date: new Date().toISOString(),
        categoryId: selectedCategory?.id || null,
      });
      // ✅ Go to Home after successful save
      goToHome();
    } catch (err: any) {
      setError(err?.message || 'Could not save the transaction. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        {/* Header - Fixed */}
        <View style={styles.headerWrapper}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Add Transaction</Text>
            {/* ✅ Close button - goes to Home */}
            <Pressable onPress={goToHome} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={AppColors.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          
          <View style={styles.typeSwitch}>
            <Pressable
              onPress={() => setType('expense')}
              style={[styles.typeBtn, type === 'expense' && styles.typeBtnExpenseActive]}>
              <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>
                Expense
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setType('profit')}
              style={[styles.typeBtn, type === 'profit' && styles.typeBtnProfitActive]}>
              <Text style={[styles.typeBtnText, type === 'profit' && styles.typeBtnTextActive]}>
                Income
              </Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Amount</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currency}>₹</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={AppColors.textFaint}
              keyboardType="decimal-pad"
              style={styles.amountInput}
            />
          </View>

          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={type === 'profit' ? 'e.g. Freelance Payment' : 'e.g. Grocery Shopping'}
            placeholderTextColor={AppColors.textFaint}
            style={styles.input}
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.chipsWrap}>
            {allCategories.map((c) => {
              const active = categoryId === c.id;
              const color = getCategoryColor(c.name);
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCategoryId(active ? null : c.id)}
                  style={[styles.chip, active && { backgroundColor: `${color}1A`, borderColor: color }]}>
                  <Ionicons name={getCategoryIcon(c.name)} size={14} color={active ? color : AppColors.textMuted} />
                  <Text style={[styles.chipText, active && { color }]}>{c.name}</Text>
                </Pressable>
              );
            })}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          
          {/* Space for fixed button */}
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Fixed Bottom Button */}
        <View style={styles.footer}>
          <AppButton
            title="Save Transaction"
            onPress={handleSave}
            loading={saving}
            style={styles.saveBtn}
          />
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
  container: {
    flex: 1,
  },
  headerWrapper: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: AppColors.background,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.md,
  },
  typeSwitch: {
    flexDirection: 'row',
    backgroundColor: AppColors.card,
    borderRadius: Radius.pill,
    padding: 4,
    marginBottom: Spacing.xl,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: Radius.pill,
  },
  typeBtnExpenseActive: {
    backgroundColor: AppColors.danger,
  },
  typeBtnProfitActive: {
    backgroundColor: AppColors.success,
  },
  typeBtnText: {
    fontWeight: '700',
    color: AppColors.textMuted,
    fontSize: 13,
  },
  typeBtnTextActive: {
    color: '#fff',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: Spacing.sm,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  currency: {
    fontSize: 24,
    fontWeight: '800',
    color: AppColors.text,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: AppColors.text,
    paddingVertical: 14,
  },
  input: {
    backgroundColor: AppColors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: Spacing.lg,
    height: 52,
    fontSize: 15,
    color: AppColors.text,
    marginBottom: Spacing.lg,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.card,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textMuted,
  },
  error: {
    color: AppColors.danger,
    fontSize: 13,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 80,
  },
  footer: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    backgroundColor: AppColors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  saveBtn: {
    borderRadius: Radius.xl,
    height: 52,
  },
});