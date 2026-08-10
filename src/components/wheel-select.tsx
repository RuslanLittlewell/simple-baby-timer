import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/state/app-state';

export interface WheelOption {
  value: string;
  label: string;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const EDGE_PAD = (ITEM_HEIGHT * (VISIBLE_ITEMS - 1)) / 2;

interface WheelSelectProps {
  // The selected option's value, not its label.
  value: string;
  options: readonly WheelOption[];
  onSelect: (value: string) => void;
}

// A field that opens its options as a spinner in a bottom sheet, the way the
// date and time fields do. A floating list would be clipped by the card it
// sits in; a modal cannot be.
export function WheelSelect({ value, options, onSelect }: WheelSelectProps) {
  const theme = useTheme();
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState(value);
  const scrollRef = useRef<ScrollView>(null);
  const selected = options.find((option) => option.value === value);
  const indexOf = (target: string) => {
    const found = options.findIndex((option) => option.value === target);
    return found < 0 ? 0 : found;
  };

  // The sheet has to be laid out before the wheel can be positioned on the
  // current option, so this waits a tick rather than scrolling on mount.
  useEffect(() => {
    if (!visible) return;
    const id = setTimeout(
      () => scrollRef.current?.scrollTo({ y: indexOf(value) * ITEM_HEIGHT, animated: false }),
      0,
    );
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, value]);

  const settle = (offsetY: number) => {
    const index = Math.max(0, Math.min(options.length - 1, Math.round(offsetY / ITEM_HEIGHT)));
    setDraft(options[index].value);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setDraft(value);
          setVisible(true);
        }}
        style={[
          styles.field,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {selected?.label ?? ''}
        </ThemedText>
        <MaterialCommunityIcons name="chevron-down" size={20} color={theme.text} />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
        <ThemedView type="backgroundElement" style={styles.sheet}>
          <View style={[styles.sheetHeader, { borderBottomColor: theme.border }]}>
            <Pressable accessibilityRole="button" onPress={() => setVisible(false)} hitSlop={12}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {t('editor.cancel')}
              </ThemedText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                onSelect(draft);
                setVisible(false);
              }}
              hitSlop={12}>
              <ThemedText type="smallBold" themeColor="primary">
                {t('common.done')}
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.wheel}>
            <View
              pointerEvents="none"
              style={[
                styles.selection,
                { backgroundColor: theme.backgroundSelected, borderColor: theme.border },
              ]}
            />
            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              contentContainerStyle={styles.wheelContent}
              onMomentumScrollEnd={(event) => settle(event.nativeEvent.contentOffset.y)}
              onScrollEndDrag={(event) => settle(event.nativeEvent.contentOffset.y)}>
              {options.map((option) => (
                <View key={option.value} style={styles.item}>
                  <ThemedText
                    type={option.value === draft ? 'smallBold' : 'small'}
                    themeColor={option.value === draft ? 'text' : 'textSecondary'}
                    numberOfLines={1}>
                    {option.label}
                  </ThemedText>
                </View>
              ))}
            </ScrollView>
          </View>
        </ThemedView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 46,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  sheet: {
    paddingBottom: Spacing.six,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  wheel: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    justifyContent: 'center',
  },
  wheelContent: {
    paddingVertical: EDGE_PAD,
  },
  selection: {
    position: 'absolute',
    left: Spacing.four,
    right: Spacing.four,
    height: ITEM_HEIGHT,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
});
