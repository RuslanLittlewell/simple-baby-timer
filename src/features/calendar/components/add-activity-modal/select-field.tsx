import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { WheelSelect } from '@/components/wheel-select';

import { styles } from './styles';
import { type SelectOption } from './types';

interface SelectFieldProps {
  label: string;
  value: string;
  options: readonly SelectOption[];
  onSelect: (value: string) => void;
}

export function SelectField({ label, value, options, onSelect }: SelectFieldProps) {
  return (
    <View style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <WheelSelect value={value} options={options} onSelect={onSelect} />
    </View>
  );
}
