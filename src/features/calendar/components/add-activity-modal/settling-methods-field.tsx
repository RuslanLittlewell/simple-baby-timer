import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

import { SETTLING_METHODS, type SettlingMethod } from '../../pro-details';
import { styles } from './styles';
import { type SectionTheme, type TranslatedSectionProps } from './types';

interface SettlingMethodsFieldProps extends TranslatedSectionProps {
  methods: SettlingMethod[];
  theme: SectionTheme;
  onToggle: (method: SettlingMethod) => void;
}

export function SettlingMethodsField({ methods, theme, onToggle, t }: SettlingMethodsFieldProps) {
  return (
    <View style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary">
        {t('manual.methods')}
      </ThemedText>
      <View style={styles.multiOptions}>
        {SETTLING_METHODS.map((method) => {
          const selected = methods.includes(method);
          const backgroundColor = selected ? theme.backgroundSelected : theme.backgroundElement;
          const borderColor = selected ? theme.text : theme.border;
          return (
            <Pressable
              key={method}
              onPress={() => onToggle(method)}
              style={[styles.multiOption, { backgroundColor, borderColor }]}>
              <ThemedText type="small">{t(`pro.${method}`)}</ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
