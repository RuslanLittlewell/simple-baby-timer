import { TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

import { styles } from './styles';
import { type EditorTheme, type TranslatedEditorProps } from './types';

interface NotesFieldProps extends TranslatedEditorProps {
  value: string;
  theme: EditorTheme;
  onChange: (value: string) => void;
}

export function NotesField({ value, theme, onChange, t }: NotesFieldProps) {
  return (
    <View style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary">
        {t('editor.notes')}
      </ThemedText>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline
        maxLength={1000}
        placeholder={t('editor.notesPlaceholder')}
        placeholderTextColor={theme.textSecondary}
        selectionColor={theme.text}
        textAlignVertical="top"
        style={[
          styles.notesInput,
          { color: theme.text, backgroundColor: theme.backgroundElement },
        ]}
      />
    </View>
  );
}
