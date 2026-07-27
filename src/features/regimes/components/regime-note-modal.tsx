import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/state/app-state';

import { KIND_STYLE } from '../constants';
import { formatMin } from '../helpers';
import { type RegimeStep } from '../types';

interface RegimeNoteModalProps {
  step: RegimeStep | null;
  onClose: () => void;
}

export function RegimeNoteModal({ step, onClose }: RegimeNoteModalProps) {
  const theme = useTheme();
  const t = useT();
  const style = step ? KIND_STYLE[step.kind] : null;

  const timeLabel = step
    ? step.startMin === null
      ? step.time
      : step.endMin === null
        ? formatMin(step.startMin)
        : `${formatMin(step.startMin)}–${formatMin(step.endMin)}`
    : '';

  return (
    <Modal visible={!!step} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <BlurView
          experimentalBlurMethod="dimezisBlurView"
          intensity={45}
          tint="dark"
          pointerEvents="none"
          style={styles.blur}
        />
        <Pressable style={[styles.card, { backgroundColor: theme.background }]} onPress={() => {}}>
          {step && style && (
            <>
              <View style={styles.header}>
                <View style={[styles.iconWrap, { backgroundColor: style.colors[0] }]}>
                  <MaterialCommunityIcons name={style.icon} size={22} color={style.fg} />
                </View>
                <View style={styles.headerText}>
                  <ThemedText style={styles.title}>{step.action}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {timeLabel}
                  </ThemedText>
                </View>
              </View>

              <ThemedText style={styles.note}>
                {step.note || t('regimes.noNote')}
              </ThemedText>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  blur: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Spacing.four,
    borderWidth: 1,
    borderColor: '#3A3D43',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
  },
  note: {
    fontSize: 15,
    lineHeight: 22,
  },
});
