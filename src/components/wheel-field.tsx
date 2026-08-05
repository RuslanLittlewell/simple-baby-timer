import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

// A percentage/flex width doesn't reliably reach the native picker view —
// it reports its own intrinsic size — so give it an explicit pixel width.
const SCREEN_WIDTH = Dimensions.get('window').width;

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore, useT } from '@/state/app-state';

interface WheelFieldProps {
  value: Date;
  mode: 'time' | 'date';
  displayText: string;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

// Opens the native iOS wheel (spinner) in a bottom sheet with a Done button;
// on Android the platform's own picker dialog is imperative, so it's only
// mounted while open.
export function WheelField({
  value,
  mode,
  displayText,
  onChange,
  minimumDate,
  maximumDate,
  style,
  textStyle,
}: WheelFieldProps) {
  const theme = useTheme();
  const themeMode = useAppStore((state) => state.themeMode);
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState(value);

  const open = () => {
    setDraft(value);
    setVisible(true);
  };

  const handleAndroidChange = (event: DateTimePickerEvent, selected?: Date) => {
    setVisible(false);
    if (event.type === 'set' && selected) onChange(selected);
  };

  return (
    <>
      <Pressable accessibilityRole="button" onPress={open} style={style}>
        <ThemedText type="smallBold" style={textStyle}>
          {displayText}
        </ThemedText>
      </Pressable>

      {Platform.OS === 'android' && visible && (
        <DateTimePicker
          value={draft}
          mode={mode}
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={handleAndroidChange}
        />
      )}

      {Platform.OS === 'ios' && (
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
                  onChange(draft);
                  setVisible(false);
                }}
                hitSlop={12}>
                <ThemedText type="smallBold" themeColor="primary">
                  {t('common.done')}
                </ThemedText>
              </Pressable>
            </View>
            <DateTimePicker
              value={draft}
              mode={mode}
              display="spinner"
              themeVariant={themeMode}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onChange={(_, selected) => selected && setDraft(selected)}
              style={styles.picker}
            />
          </ThemedView>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  sheet: {
    alignItems: 'center',
    paddingBottom: Spacing.six,
  },
  picker: {
    width: SCREEN_WIDTH,
  },
  sheetHeader: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
