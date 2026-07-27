import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isChildGradientKey } from '@/lib/children';
import { pullChildSessions, redeemInvite } from '@/lib/sync';
import { useAppStore, useT } from '@/state/app-state';

interface EnterCodeModalProps {
  visible: boolean;
  onClose: () => void;
  onJoined: () => void;
}

export function EnterCodeModal({ visible, onClose, onJoined }: EnterCodeModalProps) {
  const theme = useTheme();
  const t = useT();
  const addSharedChild = useAppStore((state) => state.addSharedChild);
  const bumpDataVersion = useAppStore((state) => state.bumpDataVersion);

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setCode('');
    setBusy(false);
    setError(false);
  }, [visible]);

  const join = async () => {
    if (busy || !code.trim()) return;
    setBusy(true);
    setError(false);
    try {
      const redeemed = await redeemInvite(code);
      const gradientKey = isChildGradientKey(redeemed.gradientKey) ? redeemed.gradientKey : 'sky';
      const child = addSharedChild(redeemed.name, gradientKey, redeemed.remoteId);
      if (!child) throw new Error('limit');
      await pullChildSessions(redeemed.remoteId, child.id);
      bumpDataVersion();
      onJoined();
    } catch {
      setError(true);
      setBusy(false);
    }
  };

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
          <ThemedText style={styles.title}>{t('children.enterCode')}</ThemedText>

          <TextInput
            value={code}
            onChangeText={(value) => {
              setCode(value.toUpperCase());
              setError(false);
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={9}
            placeholder="ABCD-1234"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.codeInput,
              { color: theme.text, backgroundColor: theme.backgroundElement },
            ]}
          />

          {error && (
            <ThemedText style={styles.errorText}>{t('children.errCode')}</ThemedText>
          )}

          <Pressable
            disabled={busy || !code.trim()}
            onPress={join}
            style={({ pressed }) => [
              styles.joinButton,
              { backgroundColor: theme.text },
              (busy || !code.trim()) && styles.disabled,
              pressed && styles.pressed,
            ]}>
            {busy ? (
              <ActivityIndicator color={theme.background} />
            ) : (
              <ThemedText style={[styles.joinButtonText, { color: theme.background }]}>
                {t('children.join')}
              </ThemedText>
            )}
          </Pressable>
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
  codeInput: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    lineHeight: 18,
  },
  joinButton: {
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.7,
  },
});
