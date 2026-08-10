import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useProPaywall } from '@/hooks/use-pro-paywall';
import { previousTabRoute } from '@/hooks/use-tab-history';
import { useTheme } from '@/hooks/use-theme';
import { regimeIndexForBirthday } from '@/lib/children';
import { useAppStore } from '@/state/app-state';

import { AgePicker } from './components/age-picker';
import { RegimeCycle } from './components/regime-cycle';
import { RegimeNoteModal } from './components/regime-note-modal';
import { RegimeSummaryCard } from './components/regime-summary';
import { RegimeTimeline } from './components/regime-timeline';
import { localizeRegimes } from './localize';
import { type RegimeStep } from './types';

const FALLBACK_AGE_INDEX = 2; // 3–4 месяца when no birthday is known

export default function RegimesScreen() {
  const theme = useTheme();
  const language = useAppStore((state) => state.language);
  const children = useAppStore((state) => state.children);
  const activeChildId = useAppStore((state) => state.activeChildId);
  const proActive = useAppStore((state) => state.proActive);
  const regimes = useMemo(() => localizeRegimes(language), [language]);
  const focused = useIsFocused();
  const openPaywall = useProPaywall();
  const router = useRouter();

  // Opening the tab without PRO shows the paywall and nothing else; closing it
  // without unlocking returns to the tab the user came from.
  useEffect(() => {
    if (!focused || proActive) return;
    openPaywall((unlocked) => {
      if (!unlocked) router.navigate(previousTabRoute() ?? '/activity');
    });
  }, [focused, proActive, openPaywall, router]);

  const birthday = children.find((c) => c.id === activeChildId)?.birthday;
  const defaultAgeIndex = birthday !== undefined
    ? regimeIndexForBirthday(birthday)
    : FALLBACK_AGE_INDEX;

  const [ageIndex, setAgeIndex] = useState(defaultAgeIndex);
  const [variantIndex, setVariantIndex] = useState(0);
  const [selectedStep, setSelectedStep] = useState<RegimeStep | null>(null);

  // Re-open on the active child's age group when the child (or its birthday) changes.
  useEffect(() => {
    setAgeIndex(defaultAgeIndex);
    setVariantIndex(0);
  }, [defaultAgeIndex]);

  const regime = regimes[ageIndex];
  const variant = regime.variants[Math.min(variantIndex, regime.variants.length - 1)];

  const selectAge = (index: number) => {
    setAgeIndex(index);
    setVariantIndex(0);
  };

  // Nothing but the app background sits under the paywall — the regimes are
  // PRO content, and the effect above is already sending the user back.
  if (!proActive) return <ThemedView gradient style={styles.container} />;

  return (
    <ThemedView gradient style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AgePicker
          labels={regimes.map((r) => r.age)}
          selectedIndex={ageIndex}
          onSelect={selectAge}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.inner}>
            {regime.summary && <RegimeSummaryCard summary={regime.summary} />}

            {regime.variants.length > 1 && (
              <View style={styles.variantRow}>
                {regime.variants.map((v, i) => {
                  const selected = i === variantIndex;
                  return (
                    <Pressable key={v.name} style={styles.variantItem} onPress={() => setVariantIndex(i)}>
                      <ThemedView
                        type={selected ? 'backgroundSelected' : 'backgroundElement'}
                        style={[styles.variantChip, selected && { borderColor: theme.text }]}>
                        <ThemedText
                          type={selected ? 'smallBold' : 'small'}
                          themeColor={selected ? 'text' : 'textSecondary'}
                          numberOfLines={1}>
                          {v.name}
                        </ThemedText>
                      </ThemedView>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {regime.timed ? (
              <RegimeTimeline variant={variant} onSelect={setSelectedStep} />
            ) : (
              <RegimeCycle variant={variant} onSelect={setSelectedStep} />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <RegimeNoteModal step={selectedStep} onClose={() => setSelectedStep(null)} />
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
  },
  scroll: {
    flex: 1,
    alignSelf: 'stretch',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  variantRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  variantItem: {
    flex: 1,
  },
  variantChip: {
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
  },
});
