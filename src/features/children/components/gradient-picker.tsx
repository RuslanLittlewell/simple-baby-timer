import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { CHILD_GRADIENT_KEYS, type ChildGradientKey } from '@/lib/children';

import { CHILD_GRADIENTS } from '../constants';

interface GradientPickerProps {
  selected: ChildGradientKey;
  onSelect: (key: ChildGradientKey) => void;
}

export function GradientPicker({ selected, onSelect }: GradientPickerProps) {
  return (
    <View style={styles.row}>
      {CHILD_GRADIENT_KEYS.map((key) => {
        const isSelected = key === selected;
        return (
          <Pressable
            key={key}
            accessibilityLabel={key}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(key)}
            style={({ pressed }) => [
              styles.swatchWrap,
              isSelected && styles.swatchSelected,
              pressed && styles.pressed,
            ]}>
            <LinearGradient
              colors={CHILD_GRADIENTS[key]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.swatch}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  swatchWrap: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: '#FFFFFF',
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  pressed: {
    opacity: 0.7,
  },
});
