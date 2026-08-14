import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PRIVACY_POLICY_URL } from '@/constants/links';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore, useT } from '@/state/app-state';

interface Plan {
  id: 'month1' | 'month3' | 'year1';
  durationKey: 'paywall.month1' | 'paywall.month3' | 'paywall.year1';
  pricePerMonth: number;
}

const PLANS: Plan[] = [
  { id: 'month1', durationKey: 'paywall.month1', pricePerMonth: 5.99 },
  { id: 'month3', durationKey: 'paywall.month3', pricePerMonth: 4.99 },
  { id: 'year1', durationKey: 'paywall.year1', pricePerMonth: 3.99 },
];

// The trial is an option of its own here — PRO is only ever granted through
// this screen, never handed out at sign-up.
type Choice = Plan['id'] | 'trial';

// How much cheaper a plan is per month than paying monthly. The single-month
// plan is the baseline, so it never carries a badge.
const savingOf = (plan: Plan) =>
  Math.round((1 - plan.pricePerMonth / PLANS[0].pricePerMonth) * 100);

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
  const activateTestPro = useAppStore((state) => state.activateTestPro);
  const startTrial = useAppStore((state) => state.startTrial);
  // With a trial or a paid plan already running there is no free period left
  // to offer — the card turns into a plain purchase. The same goes for a trial
  // that was already spent on this account.
  const proActive = useAppStore((state) => state.proActive);
  const trialUsed = useAppStore((state) => state.trialUsed);
  const trialOffered = !proActive && !trialUsed;
  const [picked, setPicked] = useState<Choice | null>(null);
  const [busy, setBusy] = useState(false);
  // Account status can land after the card is already up, so the default pick
  // is recomputed instead of frozen into state.
  const selected: Choice =
    picked && (picked !== 'trial' || trialOffered) ? picked : trialOffered ? 'trial' : 'year1';

  const confirm = () => {
    if (busy) return;
    setBusy(true);
    void (selected === 'trial' ? startTrial() : activateTestPro())
      .then(onClose)
      .catch(() => {})
      .finally(() => setBusy(false));
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

          <View style={styles.plans}>
            {trialOffered && (
              <OptionRow
                active={selected === 'trial'}
                label={t('paywall.trial')}
                price={<ThemedText type="smallBold">{t('paywall.trialPrice')}</ThemedText>}
                onPress={() => setPicked('trial')}
              />
            )}
            {PLANS.map((plan) => (
              <OptionRow
                key={plan.id}
                active={plan.id === selected}
                label={t(plan.durationKey)}
                price={
                  <ThemedText type="smallBold">
                    ${plan.pricePerMonth.toFixed(2)}
                    <ThemedText type="small" themeColor="textSecondary">
                      {t('paywall.perMonth')}
                    </ThemedText>
                  </ThemedText>
                }
                saving={savingOf(plan)}
                onPress={() => setPicked(plan.id)}
              />
            ))}
          </View>

          <Pressable
            disabled={busy}
            onPress={confirm}
            style={({ pressed }) => [styles.cta, pressed && styles.pressed, busy && styles.disabled]}>
            <LinearGradient
              colors={['#4C1D95', '#7C3AED', '#C026D3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <ThemedText style={styles.ctaText}>
              {t(
                selected === 'trial'
                  ? 'paywall.startTrial'
                  : proActive
                    ? 'paywall.pay'
                    : 'paywall.startPlan',
              )}
            </ThemedText>
          </Pressable>
          {selected === 'trial' && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
              {t('paywall.freeTrialNote')}
            </ThemedText>
          )}
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.legalLink}
            onPress={() => void WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}>
            {t('common.privacyPolicy')}
          </ThemedText>
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
  },
  // Guideline 3.1.2 wants the policy reachable from the purchase screen itself,
  // not only from the store listing.
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
