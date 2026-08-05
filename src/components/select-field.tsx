import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const OPTION_HEIGHT = 42;
const SAFE_MARGIN = 24;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  // Text shown on the closed button (the field's own caption, if any, is
  // the caller's responsibility — this component is just the button + list).
  value: string;
  options: readonly SelectOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Skips the auto-measured direction and always opens upward. Use this for
  // fields whose position makes the "is there room below" measurement
  // unreliable (e.g. right after another field that just changed the
  // layout above it).
  openUpward?: boolean;
}

// A closed button that expands into a floating options list. Measures its
// own position on open and flips the list above the button instead of below
// when there isn't enough room left on screen — this also sidesteps a
// ScrollView clipping the list, since flipping up only ever overlaps space
// the ScrollView already allocated, never space beyond its content edge.
export function SelectField({
  value,
  options,
  selectedValue,
  onSelect,
  open,
  onOpenChange,
  openUpward,
}: SelectFieldProps) {
  const theme = useTheme();
  const anchorRef = useRef<View>(null);
  const [dropUp, setDropUp] = useState(false);

  const toggle = () => {
    if (open) {
      onOpenChange(false);
      return;
    }
    if (openUpward) {
      setDropUp(true);
      onOpenChange(true);
      return;
    }
    anchorRef.current?.measureInWindow((_x, y, _width, height) => {
      const dropdownHeight = options.length * OPTION_HEIGHT + Spacing.one;
      const spaceBelow = SCREEN_HEIGHT - (y + height);
      setDropUp(spaceBelow < dropdownHeight + SAFE_MARGIN);
      onOpenChange(true);
    });
  };

  return (
    <View ref={anchorRef} collapsable={false} style={[styles.anchor, open && styles.anchorOpen]}>
      <Pressable
        accessibilityRole="button"
        onPress={toggle}
        style={[styles.select, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {value}
        </ThemedText>
        <MaterialCommunityIcons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={theme.text} />
      </Pressable>
      {open && (
        <View
          style={[
            styles.options,
            dropUp ? styles.optionsUp : styles.optionsDown,
            { borderColor: theme.border, backgroundColor: theme.backgroundElement },
          ]}>
          {options.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                onSelect(option.value);
                onOpenChange(false);
              }}
              style={[
                styles.option,
                {
                  backgroundColor:
                    option.value === selectedValue ? theme.navigationActive : theme.backgroundElement,
                },
              ]}>
              <ThemedText type="small" numberOfLines={1}>
                {option.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'relative',
    zIndex: 1,
  },
  anchorOpen: {
    zIndex: 9999,
    elevation: 24,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 46,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  options: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    borderWidth: 1,
    borderRadius: Spacing.three,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 24,
  },
  optionsDown: {
    top: '100%',
    marginTop: Spacing.one,
  },
  optionsUp: {
    bottom: '100%',
    marginBottom: Spacing.one,
  },
  option: {
    minHeight: OPTION_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
});
