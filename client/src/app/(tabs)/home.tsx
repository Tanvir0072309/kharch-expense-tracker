import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { analyticsApi, MonthlyBreakdown } from '@/api/analyticsApi';
import { BarChart } from '@/components/ui/bar-chart';
import { StickyHeader } from '@/components/ui/sticky-header';
import { TransactionRow } from '@/components/ui/transaction-row';
import { AppColors, Radius, Spacing } from '@/constants/app-colors';
import { useTransactions } from '@/context/transactions-context';

const MONTH_SHORT_LABEL: Record<string, string> = {
  January: 'Jan',
  February: 'Feb',
  March: 'Mar',
  April: 'Apr',
  May: 'May',
  June: 'Jun',
  July: 'Jul',
  August: 'Aug',
  September: 'Sep',
  October: 'Oct',
  November: 'Nov',
  December: 'Dec',
};

export default function HomeScreen() {
  const { transactions, totalBalance, totalExpense, totalProfit, loading, refreshing, refresh } = useTransactions();
  const [months, setMonths] = useState<MonthlyBreakdown[]>([]);
  const currentMonthIndex = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    let cancelled = false;
    analyticsApi
      .getMonthly({ year: currentYear })
      .then((res) => {
        if (!cancelled) setMonths(res.data.months);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [currentYear]);

  const monthlyExpenses = useMemo(() => {
    const allMonths = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const expenseMap = new Map<string, number>();
    months.forEach((m) => {
      expenseMap.set(m.month, m.expense);
    });

    return allMonths.map((month, index) => {
      const expense = expenseMap.get(month) || 0;
      const isPastOrCurrent = index <= currentMonthIndex;
      
      return {
        label: MONTH_SHORT_LABEL[month] || month.slice(0, 3),
        value: expense,
        highlighted: index === currentMonthIndex,
        isFuture: !isPastOrCurrent,
        isCurrent: index === currentMonthIndex,
        monthName: month,
        fullLabel: isPastOrCurrent ? '' : 'Upcoming',
        // Green color for upcoming months
        color: !isPastOrCurrent ? AppColors.success : undefined,
      };
    });
  }, [months, currentMonthIndex]);

  const formatIndianRupee = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StickyHeader title="Home" />
      
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={AppColors.primary} />
        }>
        
        {/* Balance Card */}
        <LinearGradient colors={[AppColors.navy, AppColors.navyLight]} style={styles.balanceCard}>
          <View style={styles.balanceTopRow}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Ionicons name="ellipsis-horizontal" size={18} color="rgba(255,255,255,0.7)" />
          </View>
          {loading ? (
            <ActivityIndicator color="#fff" style={styles.balanceLoading} />
          ) : (
            <Text style={styles.balanceValue}>{formatIndianRupee(totalBalance)}</Text>
          )}
          <View style={styles.cardBottomRow}>
            <Text style={styles.cardNumber}>2644  7545  3867  1965</Text>
            <View style={styles.cardDots}>
              <View style={[styles.dot, styles.dotRed]} />
              <View style={[styles.dot, styles.dotYellow]} />
            </View>
          </View>
        </LinearGradient>

        {/* Income + Expense Cards */}
        <View style={styles.summaryGrid}>
          <LinearGradient
            colors={['#1a1a2e', '#16213e']}
            style={styles.summaryCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>Total Income</Text>
              <View style={[styles.summaryBadge, styles.incomeBadge]}>
                <Ionicons name="trending-up" size={12} color="#fff" />
                <Text style={styles.summaryBadgeText}>
                  +{totalProfit > 0 ? Math.round((totalProfit / (totalProfit + totalExpense || 1)) * 100) : 0}%
                </Text>
              </View>
            </View>
            <Text style={styles.summaryValue}>₹{totalProfit.toLocaleString()}</Text>
            <View style={styles.summaryFooter}>
              <Ionicons name="card-outline" size={14} color="rgba(255,255,255,0.6)" />
              <Text style={styles.summaryFooterText}>
                {transactions.filter(t => t.type === 'profit').length} transactions
              </Text>
            </View>
          </LinearGradient>
          
          <LinearGradient
            colors={['#2d0a0a', '#1a0a0a']}
            style={styles.summaryCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>Total Expense</Text>
              <View style={[styles.summaryBadge, styles.expenseBadge]}>
                <Ionicons name="trending-down" size={12} color="#fff" />
                <Text style={styles.summaryBadgeText}>
                  {totalExpense > 0 ? Math.round((totalExpense / (totalProfit + totalExpense || 1)) * 100) : 0}%
                </Text>
              </View>
            </View>
            <Text style={styles.summaryValue}>₹{totalExpense.toLocaleString()}</Text>
            <View style={styles.summaryFooter}>
              <Ionicons name="card-outline" size={14} color="rgba(255,255,255,0.6)" />
              <Text style={styles.summaryFooterText}>
                {transactions.filter(t => t.type === 'expense').length} transactions
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Analytics Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Analytics</Text>
          <View style={styles.yearPill}>
            <Text style={styles.yearPillText}>Year - {currentYear}</Text>
            <Ionicons name="chevron-down" size={14} color={AppColors.accent} />
          </View>
        </View>

        <View style={styles.chartCard}>
          {monthlyExpenses.length > 0 ? (
            <>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: AppColors.primary }]} />
                  <Text style={styles.legendText}>Spent</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: AppColors.success }]} />
                  <Text style={styles.legendText}>Upcoming</Text>
                </View>
              </View>
              <BarChart data={monthlyExpenses} />
            </>
          ) : (
            <Text style={styles.emptyChart}>
              {loading ? 'Loading analytics…' : 'No expense data yet for this year.'}
            </Text>
          )}
        </View>

        {/* Transactions Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          <Text style={styles.viewAll} onPress={() => router.push('/expenses')}>
            View All
          </Text>
        </View>

        <View style={styles.listCard}>
          {loading ? (
            <ActivityIndicator color={AppColors.primary} style={styles.loader} />
          ) : transactions.length === 0 ? (
            <Text style={styles.emptyChart}>No transactions yet — add your first one!</Text>
          ) : (
            transactions.slice(0, 5).map((t) => <TransactionRow key={t.id} item={t} />)
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
  balanceCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginTop: Spacing.sm,
  },
  balanceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  balanceValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    marginTop: Spacing.sm,
  },
  balanceLoading: {
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  cardNumber: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    letterSpacing: 1,
  },
  cardDots: {
    flexDirection: 'row',
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: -8,
  },
  dotRed: {
    backgroundColor: '#EB5757',
  },
  dotYellow: {
    backgroundColor: '#F2C94C',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  summaryCard: {
    flex: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  incomeBadge: {
    backgroundColor: 'rgba(81, 207, 102, 0.3)',
  },
  expenseBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
  },
  summaryBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  summaryValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  summaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  summaryFooterText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text,
  },
  yearPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    gap: 4,
  },
  yearPillText: {
    color: AppColors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  chartCard: {
    backgroundColor: AppColors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  chartLegend: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    color: AppColors.textMuted,
    fontWeight: '500',
  },
  emptyChart: {
    fontSize: 13,
    color: AppColors.textMuted,
    paddingVertical: Spacing.lg,
    textAlign: 'center',
  },
  loader: {
    paddingVertical: Spacing.xl,
  },
  viewAll: {
    fontSize: 13,
    color: AppColors.textMuted,
    fontWeight: '600',
  },
  listCard: {
    backgroundColor: AppColors.card,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
});