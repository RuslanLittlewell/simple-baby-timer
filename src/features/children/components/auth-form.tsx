import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { sendEmailCode, signInWithApple, signInWithGoogle, verifyEmailCode } from '@/lib/supabase';
import { useT } from '@/state/app-state';

type AuthStep = 'method' | 'code';

interface AuthFormProps {
  onSignedIn: () => void;
  // Resets the form back to the method-picker step whenever this changes
  // (e.g. a parent modal's `visible` flag flipping to true again).
  resetKey?: unknown;
}

export function AuthForm({ onSignedIn, resetKey }: AuthFormProps) {
  const theme = useTheme();
  const t = useT();

  const [step, setStep] = useState<AuthStep>('method');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setStep('method');
    setEmail('');
    setCode('');
    setBusy(false);
    setError(false);
  }, [resetKey]);

  const emailValid = /.+@.+\..+/.test(email.trim());

  const withProvider = async (signIn: () => Promise<boolean>) => {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      const ok = await signIn();
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
    <View style={styles.container}>
      {step === 'method' && (
        <>
          <Pressable
            disabled={busy}
            onPress={() => void withProvider(signInWithGoogle)}
            style={({ pressed }) => [styles.googleButton, pressed && styles.pressed]}>
            <MaterialCommunityIcons name="google" size={20} color="#1F1F1F" />
            <ThemedText style={styles.googleText}>{t('auth.google')}</ThemedText>
          </Pressable>

          <Pressable
            disabled={busy}
            onPress={() => void withProvider(signInWithApple)}
            style={({ pressed }) => [styles.appleButton, pressed && styles.pressed]}>
            <MaterialCommunityIcons name="apple" size={22} color="#FFFFFF" />
            <ThemedText style={styles.appleText}>{t('onboarding.apple')}</ThemedText>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <ThemedText type="small" themeColor="textSecondary">
              {t('auth.or')}
            </ThemedText>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
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
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
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

      {error && (
        <ThemedText themeColor="danger" style={styles.errorText}>
          {t('auth.error')}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
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
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: '#000000',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
  },
  appleText: {
    color: '#FFFFFF',
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
