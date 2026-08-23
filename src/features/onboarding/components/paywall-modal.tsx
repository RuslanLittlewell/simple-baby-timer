import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
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



const TRIAL_OPTION = '__account_trial__';

interface OptionRowProps {
  active: boolean;
  compact: boolean;
  label: string;
  
  
  
  billed: string;
  
  
  secondary?: ReactNode;
  onPress: () => void;
}

function OptionRow({ active, compact, label, billed, secondary, onPress }: OptionRowProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.plan,
        compact && styles.planCompact,
        {
          borderColor: active ? '#A78BFA' : theme.border,
          backgroundColor: active ? 'rgba(124,58,237,0.14)' : theme.backgroundElement,
        },
      ]}>
      <View style={[styles.radio, { borderColor: active ? '#A78BFA' : theme.border }]}>
        {active && <View style={styles.radioDot} />}
      </View>
      <View style={styles.planText}>
        <View style={styles.planTop}>
          <ThemedText type="smallBold" style={styles.planDuration}>
            {label}
          </ThemedText>
          <ThemedText style={styles.billed}>{billed}</ThemedText>
        </View>
        {secondary}
      </View>
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
  const accountId = useAppStore((state) => state.accountId);
  const startTrial = useAppStore((state) => state.startTrial);
  const { height } = useWindowDimensions();
  const compact = height <= 700;

  const [packages, setPackages] = useState<PurchasesPackage[] | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [purchaseFailed, setPurchaseFailed] = useState(false);
  const [trialFailed, setTrialFailed] = useState(false);

  
  
  useEffect(() => {
    if (!visible) return;
    let alive = true;
    setLoadFailed(false);
    setPurchaseFailed(false);
    setTrialFailed(false);
    fetchOffering()
      .then((offering) => {
        if (alive) setPackages(offering?.availablePackages ?? []);
      })
      .catch(() => {
        if (alive) setLoadFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [visible]);

  const monthly = packages?.find((pack) => pack.packageType === PACKAGE_TYPE.MONTHLY);
  const trialPicked = picked === TRIAL_OPTION && !trialUsed;
  const selected = trialPicked
    ? null
    : (packages?.find((pack) => pack.identifier === picked) ??
      packages?.find((pack) => pack.packageType === PACKAGE_TYPE.ANNUAL) ??
      packages?.[0] ??
      null);
  
  
  
  const trialDays = selected && !trialUsed ? freeTrialDays(selected) : null;
  
  
  
  
  
  
  
  const plansSettled = packages !== null || loadFailed;
  const hasPlans = packages !== null && packages.length > 0;

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
    setPurchaseFailed(false);
    purchase(selected)
      .then((entitlement) => {
        if (apply(entitlement)) onClose();
      })
      .catch((error: unknown) => {
        
        if (!(error instanceof PurchaseCancelledError)) setPurchaseFailed(true);
      })
      .finally(() => setBusy(false));
  };

  
  
  
  const storeOffersTrial = (packages ?? []).some((pack) => freeTrialDays(pack) !== null);
  const canStartTrial = !trialUsed && !!accountId && !storeOffersTrial;

  const beginTrial = () => {
    if (busy) return;
    setBusy(true);
    setTrialFailed(false);
    startTrial()
      .then(() => onClose())
      
      
      .catch(() => setTrialFailed(true))
      .finally(() => setBusy(false));
  };

  const restore = () => {
    if (busy) return;
    setBusy(true);
    setPurchaseFailed(false);
    restorePurchases()
      .then((entitlement) => {
        if (apply(entitlement)) onClose();
        else setPurchaseFailed(true);
      })
      .catch(() => setPurchaseFailed(true))
      .finally(() => setBusy(false));
  };

  
  const billedFor = (pack: PurchasesPackage) => pack.product.priceString;

  const perMonthFor = (pack: PurchasesPackage) => {
    const months = MONTHS_IN[pack.packageType];
    if (!months || months === 1) return null;
    
    const symbol = pack.product.priceString.replace(/[\d.,\s]/g, '');
    return `${symbol}${(pack.product.price / months).toFixed(2)}${t('paywall.perMonth')}`;
  };

  const secondaryFor = (pack: PurchasesPackage) => {
    const days = trialUsed ? null : freeTrialDays(pack);
    const perMonth = perMonthFor(pack);
    const saving = savingFor(pack);
    if (!days && !perMonth && !saving) return undefined;
    return (
      <View style={styles.planSecondary}>
        {!!days && (
          <ThemedText type="small" themeColor="textSecondary">
            {t('paywall.freeDays', { days: String(days) })}
          </ThemedText>
        )}
        {!!perMonth && (
          <ThemedText type="small" themeColor="textSecondary">
            {perMonth}
          </ThemedText>
        )}
        {saving !== undefined && saving > 0 && (
          <View style={styles.badge}>
            <ThemedText style={styles.badgeText}>−{saving}%</ThemedText>
          </View>
        )}
      </View>
    );
  };

  const savingFor = (pack: PurchasesPackage) => {
    const months = MONTHS_IN[pack.packageType];
    if (!monthly || !months || months === 1) return undefined;
    return Math.round((1 - pack.product.price / months / monthly.product.price) * 100);
  };

  const trialRow = canStartTrial ? (
    <OptionRow
      key={TRIAL_OPTION}
      active={trialPicked}
      compact={compact}
      label={t('paywall.trialOption')}
      billed={`${packages?.[0]?.product.priceString.replace(/[\d.,\s]/g, '') || '$'}0`}
      onPress={() => setPicked(TRIAL_OPTION)}
    />
  ) : null;

  const labelFor = (pack: PurchasesPackage) => {
    const key = DURATION_KEY[pack.packageType];
    return key ? t(key) : pack.product.title;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.backdrop, compact && styles.backdropCompact]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <ThemedView
          type="backgroundElement"
          style={[
            styles.card,
            compact && styles.cardCompact,
            {
              borderColor: theme.border,
              maxHeight: height - (compact ? Spacing.two * 2 : Spacing.four * 2),
            },
          ]}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
            <MaterialCommunityIcons name="close" size={24} color={theme.text} />
          </Pressable>

          <MaterialCommunityIcons
            name="star-four-points"
            size={compact ? 24 : 32}
            color="#C4B5FD"
          />
          <ThemedText style={[styles.title, compact && styles.titleCompact]}>
            {t('paywall.title')}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
            {t('paywall.subtitle')}
          </ThemedText>

          {!plansSettled && <ActivityIndicator style={styles.loader} color={theme.text} />}

          {plansSettled && (hasPlans || trialRow) && (
            <ScrollView
              style={styles.plansScroll}
              contentContainerStyle={[styles.plans, compact && styles.plansCompact]}
              bounces={false}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}>
              {hasPlans &&
                packages.map((pack) => (
                  <OptionRow
                    key={pack.identifier}
                    active={pack.identifier === selected?.identifier}
                    compact={compact}
                    label={labelFor(pack)}
                    billed={billedFor(pack)}
                    secondary={secondaryFor(pack)}
                    onPress={() => setPicked(pack.identifier)}
                  />
                ))}
              {trialRow}
            </ScrollView>
          )}

          {plansSettled && !hasPlans && (
            <ThemedText type="small" themeColor="danger" style={styles.note}>
              {t(purchasesSupported ? 'paywall.error' : 'paywall.unavailable')}
            </ThemedText>
          )}

          <Pressable
            disabled={busy || (!trialPicked && !selected)}
            onPress={trialPicked ? beginTrial : buy}
            style={({ pressed }) => [
              styles.cta,
              compact && styles.ctaCompact,
              pressed && styles.pressed,
              busy || (!trialPicked && !selected) ? styles.disabled : null,
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
                {t(trialPicked || trialDays ? 'paywall.startTrial' : 'paywall.startPlan')}
              </ThemedText>
            )}
          </Pressable>

          {purchaseFailed && (
            <ThemedText type="small" themeColor="danger" style={styles.note}>
              {t('paywall.purchaseError')}
            </ThemedText>
          )}

          {trialFailed && (
            <ThemedText type="small" themeColor="danger" style={styles.note}>
              {t('paywall.trialError')}
            </ThemedText>
          )}

          
          {!trialPicked && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
              {trialDays
                ? t('paywall.trialTerms', { days: String(trialDays) })
                : t('paywall.renewalTerms')}
            </ThemedText>
          )}

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
  backdropCompact: {
    padding: Spacing.two,
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
  cardCompact: {
    gap: Spacing.one,
    padding: Spacing.three,
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
  titleCompact: {
    fontSize: 18,
    lineHeight: 22,
    marginTop: 0,
  },
  subtitle: {
    textAlign: 'center',
  },
  loader: {
    marginVertical: Spacing.four,
  },
  plans: {
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  plansScroll: {
    alignSelf: 'stretch',
    flexShrink: 1,
  },
  plansCompact: {
    gap: Spacing.two,
    marginTop: Spacing.two,
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
  planCompact: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  planText: {
    flex: 1,
    gap: Spacing.one,
  },
  planTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  billed: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  planSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  badge: {
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
  ctaCompact: {
    minHeight: 46,
    marginTop: Spacing.two,
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
