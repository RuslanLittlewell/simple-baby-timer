import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Switch, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';

import { SelectField } from '@/components/select-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LANGUAGES } from '@/i18n';
import { useAppStore, useT } from '@/state/app-state';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.5;

export function MobileMenu() {
  const theme = useTheme();
  const t = useT();
  // A SafeAreaView mounted inside a Modal measures itself only after the first
  // frame, which used to drop the header under the status bar on the very
  // first open. Reading the insets out here — where they are already known —
  // and padding by hand keeps the drawer correct from the start. The insets sit
  // on top of the drawer's own padding, the way SafeAreaView stacked them.
  const insets = useSafeAreaInsets();
  const fallback = initialWindowMetrics?.insets;
  const safeArea = {
    paddingTop: Spacing.three + (insets.top || fallback?.top || 0),
    paddingBottom: Spacing.three + (insets.bottom || fallback?.bottom || 0),
    paddingLeft: Spacing.three + (insets.left || fallback?.left || 0),
    paddingRight: Spacing.three + (insets.right || fallback?.right || 0),
  };
  const language = useAppStore((state) => state.language);
  const themeMode = useAppStore((state) => state.themeMode);
  const proActive = useAppStore((state) => state.proActive);
  const proExpiresAt = useAppStore((state) => state.proExpiresAt);
  const proRenewsAt = useAppStore((state) => state.proRenewsAt);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  // The paywall lives in the root layout, so the menu just asks for it — and
  // only once its own drawer is out of the way.
  const setPendingPaywall = useAppStore((state) => state.setPendingPaywall);
  const [visible, setVisible] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const currentLanguage = LANGUAGES.find((item) => item.code === language) ?? LANGUAGES[0];
  const drawerX = useSharedValue(DRAWER_WIDTH);
  const sheenX = useSharedValue(-100);
  const dateLocale = {
    en: 'en-US',
    ru: 'ru-RU',
    ua: 'uk-UA',
    pl: 'pl-PL',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    pt: 'pt-PT',
    it: 'it-IT',
  }[language];
  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString(dateLocale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  const proStatus = proRenewsAt
    ? t('menu.proRenewsOn', { date: formatDate(proRenewsAt) })
    : proExpiresAt
      ? t('menu.proActiveUntil', { date: formatDate(proExpiresAt) })
      : t('menu.proActive');

  useEffect(() => {
    if (!visible) return;
    drawerX.value = DRAWER_WIDTH;
    drawerX.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
    sheenX.value = -100;
    sheenX.value = withRepeat(
      withTiming(DRAWER_WIDTH + 100, { duration: 2800, easing: Easing.inOut(Easing.quad) }),
      -1,
      false,
    );
  }, [drawerX, sheenX, visible]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drawerX.value }],
  }));
  const sheenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sheenX.value }, { skewX: '-16deg' }],
  }));

  const close = (after?: () => void) => {
    setLangOpen(false);
    const finish = () => {
      setVisible(false);
      after?.();
    };
    drawerX.value = withTiming(
      DRAWER_WIDTH,
      { duration: 240, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(finish)();
      },
    );
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => setVisible(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}>
        {proActive && (
          <LinearGradient
            colors={['#4C1D95', '#7C3AED', '#C026D3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.proBadge}>
            <ThemedText style={styles.proBadgeText}>PRO</ThemedText>
          </LinearGradient>
        )}
        <MaterialCommunityIcons name="menu" size={28} color={theme.text} />
      </Pressable>

      <Modal visible={visible} transparent animationType="none" onRequestClose={() => close()}>
        <View style={styles.modal}>
          <Pressable style={styles.overlay} onPress={() => close()} />
          <Animated.View
            style={[
              styles.drawer,
              { width: DRAWER_WIDTH, backgroundColor: theme.background },
              drawerStyle,
            ]}>
            <View style={[styles.safe, safeArea]}>
              <View style={styles.drawerHeader}>
                <ThemedText type="smallBold">{t('settings.title')}</ThemedText>
                <Pressable onPress={() => close()} hitSlop={10}>
                  <MaterialCommunityIcons name="close" size={24} color={theme.text} />
                </Pressable>
              </View>

              <View style={[styles.section, langOpen && styles.sectionOpen]}>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('settings.language')}
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

              <View style={styles.section}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => close(() => setPendingPaywall(true))}
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                  <MaterialCommunityIcons name="star-circle-outline" size={18} color={theme.text} />
                  <ThemedText type="smallBold" style={styles.rowLabel}>
                    {t('menu.subscriptions')}
                  </ThemedText>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={18}
                    color={theme.textSecondary}
                  />
                </Pressable>
              </View>

              <View style={styles.section}>
                <View style={styles.themeRow}>
                  <View style={styles.themeLabel}>
                    <MaterialCommunityIcons
                      name={themeMode === 'dark' ? 'weather-night' : 'white-balance-sunny'}
                      size={18}
                      color={theme.text}
                    />
                    <ThemedText type="smallBold">{t('settings.theme')}</ThemedText>
                  </View>
                  <Switch
                    accessibilityLabel={t('settings.theme')}
                    value={themeMode === 'light'}
                    onValueChange={(isLight) => setThemeMode(isLight ? 'light' : 'dark')}
                    trackColor={{ false: theme.border, true: '#C4B5FD' }}
                  />
                </View>
              </View>

              <View style={styles.footer}>
                {proActive ? (
                  <LinearGradient
                    colors={['#4C1D95', '#7C3AED', '#C026D3']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.activePro}>
                    <ThemedText style={styles.activeProLabel}>PRO</ThemedText>
                    <ThemedText style={styles.activeProStatus}>{proStatus}</ThemedText>
                  </LinearGradient>
                ) : (
                  <Pressable
                    onPress={() => close(() => setPendingPaywall(true))}
                    style={({ pressed }) => [
                      styles.buyButton,
                      pressed && styles.pressed,
                    ]}>
                    <Animated.View pointerEvents="none" style={[styles.sheen, sheenStyle]}>
                      <LinearGradient
                        colors={[
                          'rgba(255,255,255,0)',
                          'rgba(255,255,255,0.55)',
                          'rgba(255,255,255,0)',
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                      />
                    </Animated.View>
                    <ThemedText style={styles.buyText}>{t('menu.buyPro')}</ThemedText>
                  </Pressable>
                )}
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  proBadge: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  modal: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    borderTopLeftRadius: Spacing.four,
    borderBottomLeftRadius: Spacing.four,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: -6, height: 0 },
    elevation: 18,
  },
  safe: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.three,
  },
  section: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  sectionOpen: {
    zIndex: 9999,
    elevation: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 32,
  },
  rowLabel: {
    flex: 1,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  buyButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
  buyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  activePro: {
    minHeight: 104,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderRadius: 14,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.three,
  },
  activeProLabel: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
    letterSpacing: 3,
  },
  activeProStatus: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 86,
  },
  pressed: {
    opacity: 0.7,
  },
});
