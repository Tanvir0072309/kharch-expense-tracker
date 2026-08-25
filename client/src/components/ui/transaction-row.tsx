import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppColors, Radius } from '@/constants/app-colors';
import { getCategoryColor, getCategoryIcon } from '@/constants/category-icon';
import { Transaction } from '@/types/transaction';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' });
}

// Format number to Indian Rupees
function formatIndianRupee(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function TransactionRow({ item }: { item: Transaction }) {
  const isExpense = item.type === 'expense';
  const color = getCategoryColor(item.category);

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={getCategoryIcon(item.category)} size={19} color={color} />
      </View>
      <View style={styles.middle}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>
          {item.note ? `${item.note} · ` : ''}
          {formatDate(item.date)}
        </Text>
      </View>
      <Text style={[styles.amount, isExpense ? styles.expenseAmount : styles.profitAmount]}>
        {isExpense ? '-' : '+'}{formatIndianRupee(item.amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  middle: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text,
  },
  meta: {
    fontSize: 12,
    color: AppColors.textMuted,
    marginTop: 2,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
  },
  expenseAmount: {
    color: AppColors.danger,
  },
  profitAmount: {
    color: AppColors.success,
  },
});