import { TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

import { sanitizeMilkInput } from './helpers';
import { styles } from './styles';
import { type EditorTheme, type TranslatedEditorProps } from './types';

interface MilkFieldProps extends TranslatedEditorProps {
  value: string;
  theme: EditorTheme;
  onChange: (value: string) => void;
}

export function MilkField({ value, theme, onChange, t }: MilkFieldProps) {
  return (
    <>
      <ThemedText type="small" themeColor="textSecondary">
        {t('editor.milkAmount')}
      </ThemedText>
      <View style={[styles.inputRow, { backgroundColor: theme.backgroundElement }]}>
        <TextInput
          value={value}
          onChangeText={(next) => onChange(sanitizeMilkInput(next))}
          keyboardType="number-pad"
          maxLength={4}
          placeholder="0"
          placeholderTextColor={theme.textSecondary}
          style={[styles.milkInput, { color: theme.text }]}
        />
        <ThemedText type="smallBold">{t('unit.ml')}</ThemedText>
      </View>
    </>
  );
}
