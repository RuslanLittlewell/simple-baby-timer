import { BlurView } from 'expo-blur';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/state/app-state';

import { AuthForm } from './auth-form';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSignedIn: () => void;
}

export function AuthModal({ visible, onClose, onSignedIn }: AuthModalProps) {
  const theme = useTheme();
  const t = useT();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <BlurView
          experimentalBlurMethod="dimezisBlurView"
          intensity={45}
          tint="dark"
          pointerEvents="none"
          style={styles.blur}
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <ThemedText style={styles.title}>{t('auth.title')}</ThemedText>
          <AuthForm onSignedIn={onSignedIn} resetKey={visible} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
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
  title: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
  },
});
