import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore, useT } from '@/state/app-state';

interface Plan {
  id: 'month1' | 'month3' | 'year1';
  durationKey: 'paywall.month1' | 'paywall.month3' | 'paywall.year1';
  price: string;
}

const PLANS: Plan[] = [
  { id: 'month1', durationKey: 'paywall.month1', price: '$5.99' },
  { id: 'month3', durationKey: 'paywall.month3', price: '$4.99' },
  { id: 'year1', durationKey: 'paywall.year1', price: '$3.99' },
];

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PaywallModal({ visible, onClose }: PaywallModalProps) {
  const theme = useTheme();
  const t = useT();
  const activateTestPro = useAppStore((state) => state.activateTestPro);
  const [selected, setSelected] = useState<Plan['id']>('year1');
  const [busy, setBusy] = useState(false);

  const confirm = () => {
    if (busy) return;
    setBusy(true);
    void activateTestPro()
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
            {PLANS.map((plan) => {
              const active = plan.id === selected;
              return (
                <Pressable
                  key={plan.id}
                  onPress={() => setSelected(plan.id)}
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
                    {t(plan.durationKey)}
                  </ThemedText>
                  <ThemedText type="smallBold">
                    {plan.price}
                    <ThemedText type="small" themeColor="textSecondary">
                      {t('paywall.perMonth')}
                    </ThemedText>
                  </ThemedText>
                </Pressable>
              );
            })}
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
            <ThemedText style={styles.ctaText}>{t('paywall.freeTrial')}</ThemedText>
          </Pressable>
          <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
            {t('paywall.freeTrialNote')}
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
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.85,
  },
});
