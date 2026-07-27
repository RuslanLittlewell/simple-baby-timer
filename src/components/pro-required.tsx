import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore, useT } from '@/state/app-state';

interface ProRequiredCardProps {
  onClose?: () => void;
}

export function ProRequiredCard({ onClose }: ProRequiredCardProps) {
  const theme = useTheme();
  const t = useT();
  const activateTestPro = useAppStore((state) => state.activateTestPro);

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {onClose && (
        <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
          <MaterialCommunityIcons name="close" size={24} color={theme.text} />
        </Pressable>
      )}
      <MaterialCommunityIcons name="lock-outline" size={38} color="#C4B5FD" />
      <ThemedText style={styles.title}>{t('proGate.title')}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.body}>
        {t('proGate.body')}
      </ThemedText>
      <Pressable
        onPress={() =>
          void activateTestPro()
            .then(() => onClose?.())
            .catch(() => {})
        }
        style={({ pressed }) => [styles.buy, pressed && styles.pressed]}>
        <ThemedText type="smallBold">{t('menu.buyPro')}</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

export function ProRequiredModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <ProRequiredCard onClose={onClose} />
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
    maxWidth: 360,
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.four,
    borderWidth: 1,
    borderColor: '#4C3B73',
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
  },
  body: {
    textAlign: 'center',
  },
  buy: {
    alignSelf: 'stretch',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C4B5FD',
    borderRadius: Spacing.three,
    marginTop: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
