import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StickyHeader } from '@/components/ui/sticky-header';
import { TransactionRow } from '@/components/ui/transaction-row';
import { AppColors, Radius, Spacing } from '@/constants/app-colors';
import { useTransactions } from '@/context/transactions-context';
import { TransactionType } from '@/types/transaction';

export default function ExpensesScreen() {
  const { transactions, totalExpense, totalProfit, refreshing, refresh } = useTransactions();
  const [activeTab, setActiveTab] = useState<TransactionType | 'all'>('all');

  const filteredTransactions = transactions.filter((t) => {
    if (activeTab === 'all') return true;
    return t.type === activeTab;
  });

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const count = filteredTransactions.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ✅ Sticky Header */}
      <StickyHeader title="Transactions" />
      
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={AppColors.primary} />
        }>
        
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.salaryCard]}>
            <Text style={styles.summaryLabel}>Total Income</Text>
            <Text style={styles.summaryValue}>₹{totalProfit.toLocaleString()}</Text>
            <View style={styles.summaryFooter}>
              <Ionicons name="card-outline" size={14} color="rgba(255,255,255,0.85)" />
              <Text style={styles.summaryFooterText}>Bank Account</Text>
            </View>
          </View>
          <View style={[styles.summaryCard, styles.expenseCard]}>
            <Text style={styles.summaryLabel}>Total Expense</Text>
            <Text style={styles.summaryValue}>₹{totalExpense.toLocaleString()}</Text>
            <View style={styles.summaryFooter}>
              <Ionicons name="card-outline" size={14} color="rgba(255,255,255,0.85)" />
              <Text style={styles.summaryFooterText}>Bank Account</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <Pressable
            onPress={() => setActiveTab('all')}
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              All ({transactions.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('profit')}
            style={[styles.tab, activeTab === 'profit' && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === 'profit' && styles.tabTextActive]}>
              Income ({transactions.filter(t => t.type === 'profit').length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('expense')}
            style={[styles.tab, activeTab === 'expense' && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === 'expense' && styles.tabTextActive]}>
              Expense ({transactions.filter(t => t.type === 'expense').length})
            </Text>
          </Pressable>
        </View>

        <View style={styles.totalCard}>
          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>
                {activeTab === 'all' ? 'All Transactions' : activeTab === 'profit' ? 'Total Income' : 'Total Expense'}
              </Text>
              <Text style={styles.totalCount}>{count} transactions</Text>
            </View>
            <Text style={[
              styles.totalAmount,
              activeTab === 'profit' ? styles.incomeColor : activeTab === 'expense' ? styles.expenseColor : styles.allColor
            ]}>
              ₹{totalAmount.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.listCard}>
          {filteredTransactions.length === 0 ? (
            <Text style={styles.emptyText}>
              {activeTab === 'all' ? 'No transactions yet.' : 
               activeTab === 'profit' ? 'No income recorded yet.' : 'No expenses recorded yet.'}
            </Text>
          ) : (
            filteredTransactions.map((t) => <TransactionRow key={t.id} item={t} />)
          )}
        </View>
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
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  summaryCard: {
    flex: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  salaryCard: {
    backgroundColor: AppColors.primary,
  },
  expenseCard: {
    backgroundColor: AppColors.accent,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
  },
  summaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryFooterText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: AppColors.card,
    borderRadius: Radius.xl,
    padding: 4,
    marginTop: Spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radius.lg,
  },
  tabActive: {
    backgroundColor: AppColors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textMuted,
  },
  tabTextActive: {
    color: '#fff',
  },
  totalCard: {
    backgroundColor: AppColors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text,
  },
  totalCount: {
    fontSize: 12,
    color: AppColors.textMuted,
    marginTop: 2,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '800',
  },
  incomeColor: {
    color: AppColors.success,
  },
  expenseColor: {
    color: AppColors.danger,
  },
  allColor: {
    color: AppColors.text,
  },
  listCard: {
    backgroundColor: AppColors.card,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.lg,
  },
  emptyText: {
    fontSize: 13,
    color: AppColors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
});