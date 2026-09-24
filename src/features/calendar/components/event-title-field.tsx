import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { NunitoSans, Spacing } from '@/constants/theme';

import { type Translate } from '../helpers';

export const EVENT_TITLE_MAX_LENGTH = 80;

interface EventTitleFieldTheme {
  text: string;
  textSecondary: string;
  backgroundElement: string;
}

interface EventTitleFieldProps {
  value: string;
  theme: EventTitleFieldTheme;
  onChange: (value: string) => void;
  t: Translate;
}

export function EventTitleField({ value, theme, onChange, t }: EventTitleFieldProps) {
  return (
    <View style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary">
        {t('editor.eventTitle')}
      </ThemedText>
      <TextInput
        value={value}
        onChangeText={onChange}
        maxLength={EVENT_TITLE_MAX_LENGTH}
        placeholder={t('editor.eventTitlePlaceholder')}
        placeholderTextColor={theme.textSecondary}
        selectionColor={theme.text}
        returnKeyType="done"
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.one },
  input: {
    minHeight: 46,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    fontFamily: NunitoSans.regular,
  },
});
