import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LANGUAGES } from '@/i18n';
import { useAppStore, useT } from '@/state/app-state';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.5;

export function MobileMenu() {
  const theme = useTheme();
  const t = useT();
  const language = useAppStore((state) => state.language);
  const proActive = useAppStore((state) => state.proActive);
  const proExpiresAt = useAppStore((state) => state.proExpiresAt);
  const proRenewsAt = useAppStore((state) => state.proRenewsAt);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const activateTestPro = useAppStore((state) => state.activateTestPro);
  const [visible, setVisible] = useState(false);
  const drawerX = useSharedValue(DRAWER_WIDTH);
  const sheenX = useSharedValue(-100);
  const dateLocale = {
    en: 'en-US',
    ru: 'ru-RU',
    uk: 'uk-UA',
    pl: 'pl-PL',
    es: 'es-ES',
    fr: 'fr-FR',
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

  const close = () => {
    drawerX.value = withTiming(
      DRAWER_WIDTH,
      { duration: 240, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(setVisible)(false);
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

      <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
        <View style={styles.modal}>
          <Pressable style={styles.overlay} onPress={close} />
          <Animated.View
            style={[
              styles.drawer,
              { width: DRAWER_WIDTH, backgroundColor: theme.background },
              drawerStyle,
            ]}>
            <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left']}>
              <View style={styles.drawerHeader}>
                <ThemedText type="smallBold">{t('settings.language')}</ThemedText>
                <Pressable onPress={close} hitSlop={10}>
                  <MaterialCommunityIcons name="close" size={24} color={theme.text} />
                </Pressable>
              </View>

              <View style={styles.languages}>
                {LANGUAGES.map((item) => {
                  const active = item.code === language;
                  return (
                    <Pressable
                      key={item.code}
                      onPress={() => {
                        setLanguage(item.code);
                        close();
                      }}
                      style={({ pressed }) => [
                        styles.language,
                        {
                          borderColor: active
                            ? '#A78BFA'
                            : theme.backgroundSelected,
                          backgroundColor: active
                            ? 'rgba(124,58,237,0.18)'
                            : theme.backgroundElement,
                        },
                        pressed && styles.pressed,
                      ]}>
                      <ThemedText style={styles.languageCode}>
                        {item.code.toUpperCase()}
                      </ThemedText>
                      <ThemedText type="small" numberOfLines={1}>
                        {item.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
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
                    onPress={() => void activateTestPro().catch(() => {})}
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
            </SafeAreaView>
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
    padding: Spacing.three,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.three,
  },
  languages: {
    gap: Spacing.two,
  },
  language: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  languageCode: {
    width: 24,
    fontSize: 12,
    fontWeight: '800',
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
