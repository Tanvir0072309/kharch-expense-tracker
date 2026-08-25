import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

export type PieDatum = {
  label: string;
  value: number;
  color: string;
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeSlice(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

export function PieChart({ data, size = 200 }: { data: PieDatum[]; size?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  let cursor = 0;
  const slices = data.map((d) => {
    const angle = (d.value / total) * 360;
    const startAngle = cursor;
    const endAngle = cursor + angle;
    cursor = endAngle;
    const mid = (startAngle + endAngle) / 2;
    const labelPos = polarToCartesian(cx, cy, r * 0.65, mid);
    const percent = Math.round((d.value / total) * 100);
    return { ...d, path: describeSlice(cx, cy, r, startAngle, endAngle), labelPos, percent };
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {slices.map((s, i) => (
          <Path key={i} d={s.path} fill={s.color} />
        ))}
        {slices.map((s, i) =>
          s.percent >= 8 ? (
            <SvgText
              key={`t-${i}`}
              x={s.labelPos.x}
              y={s.labelPos.y}
              fill="#fff"
              fontSize={16}
              fontWeight="bold"
              textAnchor="middle">
              {`${s.percent}%`}
            </SvgText>
          ) : null
        )}
      </Svg>
    </View>
  );
}

export function PieLegend({ data }: { data: PieDatum[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  return (
    <View style={styles.legend}>
      {data.map((d, i) => (
        <View key={i} style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: d.color }]} />
          <Text style={styles.legendLabel}>{d.label}</Text>
          <Text style={styles.legendValue}>${d.value.toLocaleString()}</Text>
          <Text style={styles.legendPercent}>{Math.round((d.value / total) * 100)}%</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    marginTop: 20,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  legendLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1B1B25',
  },
  legendValue: {
    fontSize: 13,
    color: '#8B8B9B',
    marginRight: 10,
  },
  legendPercent: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B1B25',
    width: 36,
    textAlign: 'right',
  },
});
