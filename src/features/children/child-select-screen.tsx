import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LanguageSelect } from '@/components/language-select';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MAX_CHILDREN, type Child, type ChildGradientKey } from '@/lib/children';
import { useAppStore, useT } from '@/state/app-state';

import { AddChildModal } from './components/add-child-modal';
import { AuroraBackground } from './components/aurora-background';
import { ChildCard } from './components/child-card';

export default function ChildSelectScreen() {
  const theme = useTheme();
  const router = useRouter();
  const t = useT();
  const children = useAppStore((state) => state.children);
  const activeChildId = useAppStore((state) => state.activeChildId);
  const selectChild = useAppStore((state) => state.selectChild);
  const addChild = useAppStore((state) => state.addChild);
  const [adding, setAdding] = useState(false);

  const pickChild = (child: Child) => {
    selectChild(child.id);
    router.navigate('/activity');
  };

  const saveChild = (name: string, gradientKey: ChildGradientKey) => {
    addChild(name, gradientKey);
    setAdding(false);
    router.navigate('/activity');
  };

  const canAdd = children.length < MAX_CHILDREN;

  return (
    <ThemedView style={styles.container}>
      <AuroraBackground />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <LanguageSelect />
        </View>

        <View style={styles.center}>
          {children.length === 0 && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              {t('children.empty')}
            </ThemedText>
          )}

          <View style={styles.list}>
            {children.map((child) => (
              <ChildCard
                key={child.id}
                child={child}
                isActive={child.id === activeChildId}
                onPress={() => pickChild(child)}
              />
            ))}

            {canAdd ? (
              <Pressable
                accessibilityLabel={t('children.add')}
                onPress={() => setAdding(true)}
                style={({ pressed }) => [styles.addWrap, pressed && styles.pressed]}>
                <ThemedView type="backgroundElement" style={styles.addCard}>
                  <MaterialCommunityIcons name="plus" size={28} color={theme.text} />
                </ThemedView>
              </Pressable>
            ) : (
              <ThemedText type="small" themeColor="textSecondary" style={styles.limitText}>
                {t('children.limit')}
              </ThemedText>
            )}
          </View>
        </View>

        <AddChildModal
          visible={adding}
          onClose={() => setAdding(false)}
          onSave={saveChild}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  header: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: Spacing.four,
  },
  center: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  emptyText: {
    textAlign: 'center',
  },
  list: {
    alignSelf: 'stretch',
    gap: Spacing.three,
  },
  addWrap: {
    alignSelf: 'center',
  },
  addCard: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderStyle: 'dashed',
  },
  limitText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
