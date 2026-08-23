import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface AgePickerProps {
  labels: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function AgePicker({ labels, selectedIndex, onSelect }: AgePickerProps) {
  const theme = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}>
      {labels.map((label, index) => {
        const selected = index === selectedIndex;
        return (
          <Pressable key={label} onPress={() => onSelect(index)}>
            <ThemedView
              type={selected ? 'backgroundSelected' : 'backgroundElement'}
              style={[styles.chip, selected && { borderColor: theme.text }]}>
              <ThemedText type={selected ? 'smallBold' : 'small'} themeColor={selected ? 'text' : 'textSecondary'}>
                {label}
              </ThemedText>
            </ThemedView>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  
  scroll: {
    alignSelf: 'stretch',
    flexGrow: 0,
    maxHeight: 52,
  },
  row: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
  },
});
