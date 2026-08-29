import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { type ProDetails } from '@/lib/activity-store';

import { proDetailsIcon, proDetailsLabels } from '../../pro-details';
import { styles } from './styles';
import { type EditorTheme, type TranslatedEditorProps } from './types';

interface ReadonlyProSectionProps extends TranslatedEditorProps {
  details?: ProDetails;
  theme: EditorTheme;
}

export function ReadonlyProSection({ details, theme, t }: ReadonlyProSectionProps) {
  if (!details) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        {t('manual.proRequired')}
      </ThemedText>
    );
  }
  const icon = proDetailsIcon(details) ?? 'star-outline';
  const labels = proDetailsLabels(details, t);
  return (
    <View style={styles.proSection}>
      <ThemedText type="small" themeColor="textSecondary">
        {t('editor.proParameters')}
      </ThemedText>
      <View style={[styles.proDetails, { backgroundColor: theme.backgroundElement }]}>
        <MaterialCommunityIcons name={icon} size={20} color={theme.text} />
        <View style={styles.proDetailsColumn}>
          {labels.map((label, index) => (
            <ThemedText key={`${label}-${index}`} type="smallBold">
              {label}
            </ThemedText>
          ))}
        </View>
      </View>
    </View>
  );
}
