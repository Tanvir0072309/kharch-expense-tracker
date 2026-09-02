import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Dimensions, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { StickyHeader } from '@/components/ui/sticky-header';
import { PieChart, PieLegend } from '@/components/ui/pie-chart';
import { AppColors, CategoryColors, Radius, Spacing } from '@/constants/app-colors';
import { useTransactions } from '@/context/transactions-context';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { transactions, totalExpense, totalProfit, refreshing, refresh } = useTransactions();
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'profit'>('all');

  const filteredTransactions = transactions.filter((t) => {
    if (selectedType === 'all') return true;
    return t.type === selectedType;
  });

  const categoryData = useMemo(() => {
    const byCategory = new Map<string, number>();
    filteredTransactions.forEach((t) => {
      byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount);
    });
    return Array.from(byCategory.entries())
      .map(([label, value]) => ({
        label,
        value,
        color: CategoryColors[label] ?? CategoryColors.Other,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const count = filteredTransactions.length;
  const avgAmount = count > 0 ? totalAmount / count : 0;
  const topCategory = categoryData.length > 0 ? categoryData[0] : null;

  // Last 6 months income vs expense, used for the trend chart below.
  const monthlyTrend = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; label: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        income: 0,
        expense: 0,
      });
    }
    const byKey = new Map(buckets.map((b) => [b.key, b]));
    transactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = byKey.get(key);
      if (!bucket) return;
      if (t.type === 'profit') bucket.income += t.amount;
      else bucket.expense += t.amount;
    });
    return buckets;
  }, [transactions]);
  const monthlyMax = Math.max(...monthlyTrend.flatMap((m) => [m.income, m.expense]), 1);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ✅ Sticky Header */}
      <StickyHeader title="Analytics" />
      
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={AppColors.primary} />
        }>
        
        <View style={styles.summaryGrid}>
          <LinearGradient
            colors={[AppColors.primary, '#0f3460']}
            style={styles.summaryCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <Text style={styles.summaryLabel}>Total Income</Text>
            <Text style={styles.summaryValue}>₹{totalProfit.toLocaleString()}</Text>
            <View style={styles.summaryBadge}>
              <Ionicons name="trending-up" size={14} color="#fff" />
              <Text style={styles.summaryBadgeText}>
                +{totalProfit > 0 ? Math.round((totalProfit / (totalProfit + totalExpense || 1)) * 100) : 0}%
              </Text>
            </View>
          </LinearGradient>
          
          <LinearGradient
            colors={['#FF6B6B', '#EE5A24']}
            style={styles.summaryCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <Text style={styles.summaryLabel}>Total Expense</Text>
            <Text style={styles.summaryValue}>₹{totalExpense.toLocaleString()}</Text>
            <View style={styles.summaryBadge}>
              <Ionicons name="trending-down" size={14} color="#fff" />
              <Text style={styles.summaryBadgeText}>
                {totalExpense > 0 ? Math.round((totalExpense / (totalProfit + totalExpense || 1)) * 100) : 0}%
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.netBalanceCard}>
          <Text style={styles.netBalanceLabel}>Net Balance</Text>
          <Text style={[
            styles.netBalanceValue,
            totalProfit - totalExpense >= 0 ? styles.positive : styles.negative
          ]}>
            {totalProfit - totalExpense >= 0 ? '+' : ''}₹{(totalProfit - totalExpense).toLocaleString()}
          </Text>
          <View style={styles.netBalanceSub}>
            <Text style={styles.netBalanceSubText}>
              {totalProfit - totalExpense >= 0 ? '🟢 You\'re saving money!' : '🔴 You\'re spending more than earning'}
            </Text>
          </View>
        </View>

        <View style={styles.filterTabs}>
          <Pressable
            onPress={() => setSelectedType('all')}
            style={[styles.filterTab, selectedType === 'all' && styles.filterTabActive]}>
            <Text style={[styles.filterTabText, selectedType === 'all' && styles.filterTabTextActive]}>All</Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedType('profit')}
            style={[styles.filterTab, selectedType === 'profit' && styles.filterTabActive]}>
            <Text style={[styles.filterTabText, selectedType === 'profit' && styles.filterTabTextActive]}>Income</Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedType('expense')}
            style={[styles.filterTab, selectedType === 'expense' && styles.filterTabActive]}>
            <Text style={[styles.filterTabText, selectedType === 'expense' && styles.filterTabTextActive]}>Expense</Text>
          </Pressable>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>₹{totalAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Transactions</Text>
            <Text style={styles.statValue}>{count}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Average</Text>
            <Text style={styles.statValue}>₹{Math.round(avgAmount).toLocaleString()}</Text>
          </View>
        </View>

        {topCategory && (
          <View style={styles.topCategoryCard}>
            <Text style={styles.topCategoryTitle}>🏆 Top Category</Text>
            <View style={styles.topCategoryContent}>
              <View style={[styles.topCategoryColor, { backgroundColor: topCategory.color }]} />
              <View style={styles.topCategoryInfo}>
                <Text style={styles.topCategoryName}>{topCategory.label}</Text>
                <Text style={styles.topCategoryAmount}>₹{topCategory.value.toLocaleString()}</Text>
              </View>
              <View style={styles.topCategoryPercent}>
                <Text style={styles.topCategoryPercentText}>
                  {Math.round((topCategory.value / totalAmount) * 100)}%
                </Text>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>6-Month Trend</Text>
        <View style={styles.trendCard}>
          <View style={styles.trendLegend}>
            <View style={styles.trendLegendItem}>
              <View style={[styles.trendDot, { backgroundColor: AppColors.success }]} />
              <Text style={styles.trendLegendText}>Income</Text>
            </View>
            <View style={styles.trendLegendItem}>
              <View style={[styles.trendDot, { backgroundColor: AppColors.danger }]} />
              <Text style={styles.trendLegendText}>Expense</Text>
            </View>
          </View>
          <View style={styles.trendRow}>
            {monthlyTrend.map((m) => (
              <View key={m.key} style={styles.trendCol}>
                <View style={styles.trendBars}>
                  <View
                    style={[
                      styles.trendBar,
                      {
                        height: Math.max((m.income / monthlyMax) * 90, m.income > 0 ? 4 : 0),
                        backgroundColor: AppColors.success,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.trendBar,
                      {
                        height: Math.max((m.expense / monthlyMax) * 90, m.expense > 0 ? 4 : 0),
                        backgroundColor: AppColors.danger,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.trendLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Spending Breakdown</Text>
        <View style={styles.chartCard}>
          {categoryData.length > 0 ? (
            <>
              <View style={styles.pieWrap}>
                {/* FIXED: Removed is3D={true} */}
                <PieChart data={categoryData} size={Math.min(width - 120, 220)} />
              </View>
              <View style={styles.legendWrapper}>
                <PieLegend data={categoryData} />
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="pie-chart-outline" size={48} color={AppColors.textFaint} />
              <Text style={styles.emptyText}>No data available</Text>
              <Text style={styles.emptySubtext}>
                {selectedType === 'all' ? 'Add transactions to see analytics' :
                 selectedType === 'profit' ? 'Add income to see analytics' : 
                 'Add expenses to see analytics'}
              </Text>
            </View>
          )}
        </View>

        {categoryData.length > 0 && (
          <View style={styles.insightsCard}>
            <Text style={styles.insightsTitle}>💡 Insights</Text>
            <View style={styles.insightItem}>
              <View style={[styles.insightIcon, { backgroundColor: AppColors.primary + '20' }]}>
                <Ionicons name="bar-chart" size={16} color={AppColors.primary} />
              </View>
              <Text style={styles.insightText}>
                Your top category is <Text style={styles.insightHighlight}>{topCategory?.label}</Text> 
                {' '}({Math.round((topCategory?.value || 0) / totalAmount * 100)}% of total)
              </Text>
            </View>
            {totalProfit > 0 && totalExpense > 0 && (
              <View style={styles.insightItem}>
                <View style={[styles.insightIcon, { backgroundColor: AppColors.success + '20' }]}>
                  <Ionicons name="cash-outline" size={16} color={AppColors.success} />
                </View>
                <Text style={styles.insightText}>
                  You're saving <Text style={styles.insightHighlight}>₹{(totalProfit - totalExpense).toLocaleString()}</Text> 
                  {' '}({Math.round((totalProfit / (totalProfit + totalExpense)) * 100)}% of total)
                </Text>
              </View>
            )}
            {count > 0 && (
              <View style={styles.insightItem}>
                <View style={[styles.insightIcon, { backgroundColor: AppColors.accent + '20' }]}>
                  <Ionicons name="receipt-outline" size={16} color={AppColors.accent} />
                </View>
                <Text style={styles.insightText}>
                  Average {selectedType === 'profit' ? 'income' : selectedType === 'expense' ? 'expense' : 'transaction'}: 
                  {' '}<Text style={styles.insightHighlight}>₹{Math.round(avgAmount).toLocaleString()}</Text>
                </Text>
              </View>
            )}
          </View>
        )}
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
  summaryGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  summaryBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  netBalanceCard: {
    backgroundColor: AppColors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  netBalanceLabel: {
    fontSize: 12,
    color: AppColors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  netBalanceValue: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
  },
  positive: {
    color: AppColors.success,
  },
  negative: {
    color: AppColors.danger,
  },
  netBalanceSub: {
    marginTop: 4,
  },
  netBalanceSubText: {
    fontSize: 12,
    color: AppColors.textMuted,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: AppColors.card,
    borderRadius: Radius.xl,
    padding: 4,
    marginTop: Spacing.lg,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radius.lg,
  },
  filterTabActive: {
    backgroundColor: AppColors.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textMuted,
  },
  filterTabTextActive: {
    color: '#fff',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: AppColors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  statLabel: {
    fontSize: 10,
    color: AppColors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: AppColors.text,
    marginTop: 2,
  },
  topCategoryCard: {
    backgroundColor: AppColors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  topCategoryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textMuted,
    marginBottom: Spacing.sm,
  },
  topCategoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topCategoryColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
  },
  topCategoryInfo: {
    flex: 1,
  },
  topCategoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text,
  },
  topCategoryAmount: {
    fontSize: 12,
    color: AppColors.textMuted,
  },
  topCategoryPercent: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  topCategoryPercentText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.accent,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.md,
  },
  trendCard: {
    backgroundColor: AppColors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  trendLegend: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: Spacing.md,
  },
  trendLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  trendLegendText: {
    fontSize: 11,
    color: AppColors.textMuted,
    fontWeight: '600',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 110,
  },
  trendCol: {
    alignItems: 'center',
    flex: 1,
  },
  trendBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 90,
  },
  trendBar: {
    width: 8,
    borderRadius: 4,
  },
  trendLabel: {
    fontSize: 10,
    color: AppColors.textMuted,
    fontWeight: '600',
    marginTop: 6,
  },
  chartCard: {
    backgroundColor: AppColors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  pieWrap: {
    marginBottom: Spacing.sm,
  },
  legendWrapper: {
    width: '100%',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 13,
    color: AppColors.textMuted,
    marginTop: 4,
  },
  insightsCard: {
    backgroundColor: AppColors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: Spacing.md,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  insightIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: AppColors.textMuted,
    lineHeight: 20,
  },
  insightHighlight: {
    color: AppColors.text,
    fontWeight: '700',
  },
});