import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuroraBackground } from '@/components/aurora-background';
import { SelectField } from '@/components/select-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LANGUAGES } from '@/i18n';
import { useAppStore, useT } from '@/state/app-state';

import { HelloTypewriter } from './components/hello-typewriter';

interface WelcomeScreenProps {
  onContinue: () => void;
}

export function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  const theme = useTheme();
  const t = useT();
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const currentLanguage = LANGUAGES.find((item) => item.code === language) ?? LANGUAGES[0];
  const [langOpen, setLangOpen] = useState(false);

  return (
    <ThemedView gradient style={styles.container}>
      <AuroraBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.brand}>
          <ThemedText style={styles.brandText}>Simple Baby Tracker</ThemedText>
        </View>

        <View style={styles.center}>
          <HelloTypewriter />

          <View style={[styles.languageBlock, langOpen && styles.languageBlockOpen]}>
            <ThemedText type="small" themeColor="textSecondary">
              {t('onboarding.chooseLanguage')}
            </ThemedText>
            <SelectField
              value={currentLanguage.label}
              selectedValue={language}
              options={LANGUAGES.map((item) => ({ value: item.code, label: item.label }))}
              onSelect={(code) => setLanguage(code as typeof language)}
              open={langOpen}
              onOpenChange={setLangOpen}
            />
          </View>
        </View>

        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [
            styles.continueButton,
            { backgroundColor: theme.text },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="smallBold" style={[styles.continueText, { color: theme.background }]}>
            {t('onboarding.continue')}
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  safe: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  brand: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingTop: Spacing.five,
  },
  brandText: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  center: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: Spacing.five,
  },
  languageBlock: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    zIndex: 1,
  },
  languageBlockOpen: {
    zIndex: 9999,
  },
  continueButton: {
    alignSelf: 'stretch',
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.three,
    marginBottom: Spacing.four,
  },
  continueText: {
    fontSize: 16,
  },
  pressed: {
    opacity: 0.7,
  },
});
