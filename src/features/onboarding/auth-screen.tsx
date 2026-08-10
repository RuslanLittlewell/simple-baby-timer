import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuroraBackground } from '@/components/aurora-background';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { AuthForm } from '@/features/children/components/auth-form';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/state/app-state';

interface OnboardingAuthScreenProps {
  // Omitted when the screen is a gate rather than a step: a user whose account
  // is gone has nowhere to go back to.
  onBack?: () => void;
  onSignedIn: () => void;
}

export function OnboardingAuthScreen({ onBack, onSignedIn }: OnboardingAuthScreenProps) {
  const theme = useTheme();
  const t = useT();

  return (
    <ThemedView gradient style={styles.container}>
      <AuroraBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.header}>
            {onBack && (
              <Pressable accessibilityLabel={t('editor.cancel')} onPress={onBack} hitSlop={12}>
                <MaterialCommunityIcons name="chevron-left" size={28} color={theme.text} />
              </Pressable>
            )}
          </View>

          <View style={styles.center}>
            <View style={styles.titleBlock}>
              <ThemedText style={styles.title}>{t('auth.title')}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
                {t('onboarding.authSubtitle')}
              </ThemedText>
            </View>

            <AuthForm onSignedIn={onSignedIn} />
          </View>
        </KeyboardAvoidingView>
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
  flex: {
    flex: 1,
    alignSelf: 'stretch',
  },
  header: {
    alignSelf: 'stretch',
    paddingTop: Spacing.two,
  },
  center: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: Spacing.five,
  },
  titleBlock: {
    gap: Spacing.one,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
  },
});
