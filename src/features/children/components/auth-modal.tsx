import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
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
import { sendEmailCode, signInWithGoogle, verifyEmailCode } from '@/lib/supabase';
import { useT } from '@/state/app-state';

type AuthStep = 'method' | 'code';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSignedIn: () => void;
}

export function AuthModal({ visible, onClose, onSignedIn }: AuthModalProps) {
  const theme = useTheme();
  const t = useT();

  const [step, setStep] = useState<AuthStep>('method');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setStep('method');
    setEmail('');
    setCode('');
    setBusy(false);
    setError(false);
  }, [visible]);

  const emailValid = /.+@.+\..+/.test(email.trim());

  const google = async () => {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      const ok = await signInWithGoogle();
      if (ok) onSignedIn();
      else setBusy(false);
    } catch {
      setError(true);
      setBusy(false);
    }
  };

  const sendCode = async () => {
    if (busy || !emailValid) return;
    setBusy(true);
    setError(false);
    try {
      await sendEmailCode(email.trim());
      setStep('code');
      setBusy(false);
    } catch {
      setError(true);
      setBusy(false);
    }
  };

  const verify = async () => {
    if (busy || code.trim().length < 6) return;
    setBusy(true);
    setError(false);
    try {
      await verifyEmailCode(email.trim(), code.trim());
      onSignedIn();
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
          <ThemedText style={styles.title}>{t('auth.title')}</ThemedText>

          {step === 'method' && (
            <>
              <Pressable
                disabled={busy}
                onPress={google}
                style={({ pressed }) => [
                  styles.googleButton,
                  pressed && styles.pressed,
                ]}>
                <MaterialCommunityIcons name="google" size={20} color="#1F1F1F" />
                <ThemedText style={styles.googleText}>{t('auth.google')}</ThemedText>
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: theme.backgroundSelected }]} />
                <ThemedText type="small" themeColor="textSecondary">
                  {t('auth.or')}
                </ThemedText>
                <View style={[styles.dividerLine, { backgroundColor: theme.backgroundSelected }]} />
              </View>

              <TextInput
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setError(false);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={t('auth.emailPlaceholder')}
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  { color: theme.text, backgroundColor: theme.backgroundElement },
                ]}
              />
              <Pressable
                disabled={busy || !emailValid}
                onPress={sendCode}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: theme.text },
                  (busy || !emailValid) && styles.disabled,
                  pressed && styles.pressed,
                ]}>
                {busy ? (
                  <ActivityIndicator color={theme.background} />
                ) : (
                  <ThemedText style={[styles.primaryText, { color: theme.background }]}>
                    {t('auth.sendCode')}
                  </ThemedText>
                )}
              </Pressable>
            </>
          )}

          {step === 'code' && (
            <>
              <ThemedText type="small" themeColor="textSecondary">
                {t('auth.codeSent', { email: email.trim() })}
              </ThemedText>
              <TextInput
                value={code}
                onChangeText={(value) => {
                  setCode(value.replace(/[^0-9]/g, ''));
                  setError(false);
                }}
                keyboardType="number-pad"
                // Supabase's Email OTP length is configurable (6–10 digits).
                maxLength={10}
                placeholder="00000000"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  styles.codeInput,
                  { color: theme.text, backgroundColor: theme.backgroundElement },
                ]}
              />
              <Pressable
                disabled={busy || code.trim().length < 6}
                onPress={verify}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: theme.text },
                  (busy || code.trim().length < 6) && styles.disabled,
                  pressed && styles.pressed,
                ]}>
                {busy ? (
                  <ActivityIndicator color={theme.background} />
                ) : (
                  <ThemedText style={[styles.primaryText, { color: theme.background }]}>
                    {t('auth.verify')}
                  </ThemedText>
                )}
              </Pressable>
            </>
          )}

          {error && <ThemedText style={styles.errorText}>{t('auth.error')}</ThemedText>}
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
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: '#FFFFFF',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
  },
  googleText: {
    color: '#1F1F1F',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  input: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    lineHeight: 18,
  },
  disabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.7,
  },
});
