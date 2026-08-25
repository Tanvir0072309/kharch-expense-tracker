import { StyleSheet, Text, View } from 'react-native';

import { AppColors, Radius } from '@/constants/app-colors';

type BarDatum = {
  label: string;
  value: number;
  highlighted?: boolean;
};

export function BarChart({ data, height = 120 }: { data: BarDatum[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={[styles.row, { height: height + 24 }]}>
      {data.map((d, i) => {
        const barHeight = Math.max((d.value / max) * height, 6);
        return (
          <View key={i} style={styles.col}>
            {d.highlighted ? (
              <Text style={styles.valueLabel}>${d.value}</Text>
            ) : (
              <View style={styles.valueLabelSpacer} />
            )}
            <View
              style={[
                styles.bar,
                {
                  height: barHeight,
                  backgroundColor: d.highlighted ? AppColors.primary : AppColors.primaryLight,
                },
              ]}
            />
            <Text style={[styles.label, d.highlighted && styles.labelHighlighted]}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  col: {
    alignItems: 'center',
    flex: 1,
  },
  valueLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: AppColors.primary,
    marginBottom: 4,
  },
  valueLabelSpacer: {
    height: 16,
  },
  bar: {
    width: 14,
    borderRadius: Radius.sm,
  },
  label: {
    fontSize: 11,
    color: AppColors.textFaint,
    marginTop: 8,
  },
  labelHighlighted: {
    color: AppColors.text,
    fontWeight: '700',
  },
});
