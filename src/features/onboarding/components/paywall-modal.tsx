import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { PACKAGE_TYPE, type PurchasesPackage } from 'react-native-purchases';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PRIVACY_POLICY_URL, TERMS_URL } from '@/constants/links';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  PurchaseCancelledError,
  fetchOffering,
  freeTrialDays,
  purchase,
  purchasesSupported,
  restorePurchases,
  type ProEntitlement,
} from '@/lib/purchases';
import { useAppStore, useT } from '@/state/app-state';

// How many months a package covers, for the "per month" comparison. Anything
// outside this list is shown at its plain price with no comparison.
const MONTHS_IN: Partial<Record<PACKAGE_TYPE, number>> = {
  [PACKAGE_TYPE.MONTHLY]: 1,
  [PACKAGE_TYPE.TWO_MONTH]: 2,
  [PACKAGE_TYPE.THREE_MONTH]: 3,
  [PACKAGE_TYPE.SIX_MONTH]: 6,
  [PACKAGE_TYPE.ANNUAL]: 12,
};

const DURATION_KEY: Partial<Record<PACKAGE_TYPE, 'paywall.month1' | 'paywall.month3' | 'paywall.year1'>> =
  {
    [PACKAGE_TYPE.MONTHLY]: 'paywall.month1',
    [PACKAGE_TYPE.THREE_MONTH]: 'paywall.month3',
    [PACKAGE_TYPE.ANNUAL]: 'paywall.year1',
  };

// App Store Connect asks for a review screenshot before the store products can
// necessarily be fetched. Development builds keep a display-only version of
// the three planned tiers for that screenshot; production only shows prices
// returned by Apple through RevenueCat.
const PREVIEW_PLANS = [
  { id: 'month1', durationKey: 'paywall.month1', pricePerMonth: 5.99 },
  { id: 'month3', durationKey: 'paywall.month3', pricePerMonth: 4.99 },
  { id: 'year1', durationKey: 'paywall.year1', pricePerMonth: 3.99 },
] as const;

interface OptionRowProps {
  active: boolean;
  label: string;
  price: ReactNode;
  // Percent saved against the monthly plan; omitted rows carry no badge.
  saving?: number;
  onPress: () => void;
}

function OptionRow({ active, label, price, saving, onPress }: OptionRowProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.plan,
        {
          borderColor: active ? '#A78BFA' : theme.border,
          backgroundColor: active ? 'rgba(124,58,237,0.14)' : theme.backgroundElement,
        },
      ]}>
      <View style={[styles.radio, { borderColor: active ? '#A78BFA' : theme.border }]}>
        {active && <View style={styles.radioDot} />}
      </View>
      <ThemedText type="smallBold" style={styles.planDuration}>
        {label}
      </ThemedText>
      {price}
      {saving !== undefined && saving > 0 && (
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>−{saving}%</ThemedText>
        </View>
      )}
    </Pressable>
  );
}

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PaywallModal({ visible, onClose }: PaywallModalProps) {
  const theme = useTheme();
  const t = useT();
  const setProStatus = useAppStore((state) => state.setProStatus);
  const trialUsed = useAppStore((state) => state.trialUsed);

  const [packages, setPackages] = useState<PurchasesPackage[] | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [previewPicked, setPreviewPicked] = useState<(typeof PREVIEW_PLANS)[number]['id']>('year1');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  // Prices, durations and any free trial come from the store, already in the
  // user's currency — nothing about them is hardcoded here.
  useEffect(() => {
    if (!visible) return;
    let alive = true;
    setFailed(false);
    fetchOffering()
      .then((offering) => {
        if (alive) setPackages(offering?.availablePackages ?? []);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [visible]);

  const monthly = packages?.find((pack) => pack.packageType === PACKAGE_TYPE.MONTHLY);
  const selected =
    packages?.find((pack) => pack.identifier === picked) ??
    packages?.find((pack) => pack.packageType === PACKAGE_TYPE.ANNUAL) ??
    packages?.[0] ??
    null;
  const trialDays = selected ? freeTrialDays(selected) : null;
  // Before the App Store app exists there cannot be an Apple SDK key yet, but
  // App Store Connect still asks for a screenshot of this screen. In that
  // bootstrap state show the display-only plans in any build. Once the key is
  // present, fallback remains development-only and production requires real
  // products from RevenueCat.
  const showPreview =
    !purchasesSupported ||
    (__DEV__ && (failed || (packages !== null && packages.length === 0)));

  const apply = useCallback(
    (entitlement: ProEntitlement) => {
      if (!entitlement.active) return false;
      setProStatus(true, entitlement.expiresAt, entitlement.renewsAt, trialUsed);
      return true;
    },
    [setProStatus, trialUsed],
  );

  const buy = () => {
    if (busy || !selected) return;
    setBusy(true);
    setFailed(false);
    purchase(selected)
      .then((entitlement) => {
        if (apply(entitlement)) onClose();
      })
      .catch((error: unknown) => {
        // Backing out of Apple's sheet is not a failure worth shouting about.
        if (!(error instanceof PurchaseCancelledError)) setFailed(true);
      })
      .finally(() => setBusy(false));
  };

  const restore = () => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    restorePurchases()
      .then((entitlement) => {
        if (apply(entitlement)) onClose();
        else setFailed(true);
      })
      .catch(() => setFailed(true))
      .finally(() => setBusy(false));
  };

  const priceFor = (pack: PurchasesPackage) => {
    const months = MONTHS_IN[pack.packageType];
    if (!months || months === 1) {
      return <ThemedText type="smallBold">{pack.product.priceString}</ThemedText>;
    }
    // Same currency as priceString, so the symbol is taken from it.
    const perMonth = (pack.product.price / months).toFixed(2);
    const symbol = pack.product.priceString.replace(/[\d.,\s]/g, '');
    return (
      <ThemedText type="smallBold">
        {symbol}
        {perMonth}
        <ThemedText type="small" themeColor="textSecondary">
          {t('paywall.perMonth')}
        </ThemedText>
      </ThemedText>
    );
  };

  const savingFor = (pack: PurchasesPackage) => {
    const months = MONTHS_IN[pack.packageType];
    if (!monthly || !months || months === 1) return undefined;
    return Math.round((1 - pack.product.price / months / monthly.product.price) * 100);
  };

  const labelFor = (pack: PurchasesPackage) => {
    const key = DURATION_KEY[pack.packageType];
    return key ? t(key) : pack.product.title;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
            <MaterialCommunityIcons name="close" size={24} color={theme.text} />
          </Pressable>

          <MaterialCommunityIcons name="star-four-points" size={32} color="#C4B5FD" />
          <ThemedText style={styles.title}>{t('paywall.title')}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
            {t('paywall.subtitle')}
          </ThemedText>

          {packages === null && !failed && (
            <ActivityIndicator style={styles.loader} color={theme.text} />
          )}

          {packages !== null && packages.length > 0 && (
            <View style={styles.plans}>
              {packages.map((pack) => {
                const days = freeTrialDays(pack);
                return (
                  <OptionRow
                    key={pack.identifier}
                    active={pack.identifier === selected?.identifier}
                    label={
                      days
                        ? `${labelFor(pack)} · ${t('paywall.freeDays', { days: String(days) })}`
                        : labelFor(pack)
                    }
                    price={priceFor(pack)}
                    saving={savingFor(pack)}
                    onPress={() => setPicked(pack.identifier)}
                  />
                );
              })}
            </View>
          )}

          {showPreview && (
            <View style={styles.plans}>
              {PREVIEW_PLANS.map((plan) => (
                <OptionRow
                  key={plan.id}
                  active={plan.id === previewPicked}
                  label={t(plan.durationKey)}
                  price={
                    <ThemedText type="smallBold">
                      ${plan.pricePerMonth.toFixed(2)}
                      <ThemedText type="small" themeColor="textSecondary">
                        {t('paywall.perMonth')}
                      </ThemedText>
                    </ThemedText>
                  }
                  saving={
                    plan.id === 'month1'
                      ? undefined
                      : Math.round(
                          (1 - plan.pricePerMonth / PREVIEW_PLANS[0].pricePerMonth) * 100,
                        )
                  }
                  onPress={() => setPreviewPicked(plan.id)}
                />
              ))}
            </View>
          )}

          {!showPreview && (failed || (packages !== null && packages.length === 0)) && (
            <ThemedText type="small" themeColor="danger" style={styles.note}>
              {t(purchasesSupported ? 'paywall.error' : 'paywall.unavailable')}
            </ThemedText>
          )}

          <Pressable
            disabled={busy || (!selected && !showPreview)}
            onPress={buy}
            style={({ pressed }) => [
              styles.cta,
              pressed && styles.pressed,
              (busy || (!selected && !showPreview)) && styles.disabled,
            ]}>
            <LinearGradient
              colors={['#4C1D95', '#7C3AED', '#C026D3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.ctaText}>
                {t(trialDays ? 'paywall.startTrial' : 'paywall.startPlan')}
              </ThemedText>
            )}
          </Pressable>

          {/* Guideline 3.1.2 asks for the renewal terms and a way to restore a
              purchase, both on the purchase screen itself. */}
          <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
            {trialDays
              ? t('paywall.trialTerms', { days: String(trialDays) })
              : t('paywall.renewalTerms')}
          </ThemedText>

          <Pressable disabled={busy} onPress={restore} hitSlop={8}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.legalLink}>
              {t('paywall.restore')}
            </ThemedText>
          </Pressable>

          <View style={styles.legalRow}>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.legalLink}
              onPress={() => void WebBrowser.openBrowserAsync(TERMS_URL)}>
              {t('common.terms')}
            </ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.legalLink}
              onPress={() => void WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}>
              {t('common.privacyPolicy')}
            </ThemedText>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.four,
    borderWidth: 1,
    padding: Spacing.four,
  },
  close: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
  },
  title: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: Spacing.one,
  },
  subtitle: {
    textAlign: 'center',
  },
  loader: {
    marginVertical: Spacing.four,
  },
  plans: {
    alignSelf: 'stretch',
    // Wide enough for the discount badges to sit between the rows.
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  // Sits on the row's top border, breaking it the way a notch label does.
  badge: {
    position: 'absolute',
    top: -9,
    right: Spacing.three,
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
    backgroundColor: '#7C3AED',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#A78BFA',
  },
  planDuration: {
    flex: 1,
  },
  cta: {
    alignSelf: 'stretch',
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.three,
    overflow: 'hidden',
    marginTop: Spacing.three,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  note: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 15,
  },
  legalRow: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  legalLink: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 17,
    textDecorationLine: 'underline',
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.85,
  },
});
