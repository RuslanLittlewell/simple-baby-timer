import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuroraBackground } from '@/components/aurora-background';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { AddChildModal } from '@/features/children/components/add-child-modal';
import { EnterCodeModal } from '@/features/children/components/enter-code-modal';
import { useTheme } from '@/hooks/use-theme';
import { type ChildGradientKey } from '@/lib/children';
import { useAppStore, useT } from '@/state/app-state';

interface ChildSetupScreenProps {
  onDone: () => void;
}

export function ChildSetupScreen({ onDone }: ChildSetupScreenProps) {
  const theme = useTheme();
  const t = useT();
  const addChild = useAppStore((state) => state.addChild);
  const [adding, setAdding] = useState(false);
  const [enteringCode, setEnteringCode] = useState(false);

  const saveChild = (name: string, gradientKey: ChildGradientKey, birthday: number) => {
    addChild(name, gradientKey, birthday);
    setAdding(false);
    onDone();
  };

  return (
    <ThemedView gradient style={styles.container}>
      <AuroraBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.center}>
          <ThemedText style={styles.title}>{t('onboarding.childSetupTitle')}</ThemedText>

          <View style={styles.options}>
            <View style={styles.option}>
              <ThemedText type="smallBold" style={styles.optionLabel}>
                {t('children.add')}
              </ThemedText>
              <Pressable
                accessibilityLabel={t('children.add')}
                onPress={() => setAdding(true)}
                style={({ pressed }) => pressed && styles.pressed}>
                <ThemedView type="backgroundElement" style={styles.tile}>
                  <MaterialCommunityIcons name="plus" size={40} color={theme.text} />
                </ThemedView>
              </Pressable>
            </View>

            <View style={styles.option}>
              <ThemedText type="smallBold" style={styles.optionLabel}>
                {t('children.enterCode')}
              </ThemedText>
              <Pressable
                accessibilityLabel={t('children.enterCode')}
                onPress={() => setEnteringCode(true)}
                style={({ pressed }) => pressed && styles.pressed}>
                <ThemedView type="backgroundElement" style={styles.tile}>
                  <MaterialCommunityIcons name="cloud-plus-outline" size={36} color={theme.text} />
                </ThemedView>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <AddChildModal visible={adding} onClose={() => setAdding(false)} onSave={saveChild} />
      <EnterCodeModal
        visible={enteringCode}
        onClose={() => setEnteringCode(false)}
        onJoined={() => {
          setEnteringCode(false);
          onDone();
        }}
      />
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
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  center: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: Spacing.five,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  options: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  option: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  optionLabel: {
    textAlign: 'center',
  },
  tile: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.four,
  },
  pressed: {
    opacity: 0.7,
  },
});
