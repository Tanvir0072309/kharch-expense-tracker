import { useRef } from 'react';
import { NativeSyntheticEvent, StyleSheet, TextInput, TextInputKeyPressEventData, View } from 'react-native';

import { AppColors, Radius } from '@/constants/app-colors';

type Props = {
  length?: number;
  value: string[];
  onChange: (value: string[]) => void;
};

export function OtpInput({ length = 4, value, onChange }: Props) {
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...value];
    next[index] = digit;
    onChange(next);
    if (digit && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {Array.from({ length }).map((_, i) => (
        <TextInput
          key={i}
          ref={(ref) => {
            inputs.current[i] = ref;
          }}
          value={value[i] ?? ''}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={1}
          style={[styles.box, value[i] ? styles.boxFilled : undefined]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginVertical: 24,
  },
  box: {
    width: 56,
    height: 60,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: AppColors.border,
    backgroundColor: AppColors.card,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.text,
  },
  boxFilled: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primaryLight,
  },
});
