import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as WebBrowser from 'expo-web-browser';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PRIVACY_POLICY_URL } from '@/constants/links';
import { Spacing } from '@/constants/theme';
import { signInWithApple, signInWithGoogle } from '@/lib/supabase';
import { LatestAttemptCoordinator } from '@/lib/auth-generation';
import { useT } from '@/state/app-state';

interface AuthFormProps {
  onSignedIn: () => void;
}

export function AuthForm({ onSignedIn }: AuthFormProps) {
  const t = useT();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  // The provider's own words, when it gave any. Shown under the generic line
  // so a failed sign-in is reportable instead of just silent.
  const [detail, setDetail] = useState('');
  const attemptRef = useRef(new LatestAttemptCoordinator());

  const withProvider = async (signIn: () => Promise<boolean>) => {
    if (busy) return;
    const attempt = attemptRef.current.begin();
    setBusy(true);
    setError(false);
    setDetail('');
    try {
      const ok = await signIn();
      if (!attemptRef.current.isCurrent(attempt)) return;
      if (ok) onSignedIn();
    } catch {
      if (!attemptRef.current.isCurrent(attempt)) return;
      setError(true);
      // Detailed provider payloads may contain credentials or account data.
      // The translated generic message is enough for a retry; sanitized stage
      // diagnostics are emitted only in development.
      setDetail('');
    } finally {
      if (attemptRef.current.isCurrent(attempt)) setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
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

      {busy && <ActivityIndicator />}

      {error && (
        <View style={styles.errorBlock}>
          <ThemedText themeColor="danger" style={styles.errorText}>
            {t('auth.error')}
          </ThemedText>
          {detail !== '' && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.errorDetail}>
              {detail}
            </ThemedText>
          )}
        </View>
      )}

      {/* Signing in is what creates the account, so consent is collected here
          rather than behind a checkbox nobody reads. */}
      <ThemedText type="small" themeColor="textSecondary" style={styles.consent}>
        {t('auth.consentPrefix')}{' '}
        <ThemedText
          type="small"
          style={styles.consentLink}
          onPress={() => void WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}>
          {t('auth.consentLink')}
        </ThemedText>
      </ThemedText>
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
  errorBlock: {
    gap: Spacing.one,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
  },
  errorDetail: {
    fontSize: 11,
    lineHeight: 15,
  },
  consent: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 17,
  },
  consentLink: {
    fontSize: 12,
    lineHeight: 17,
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.7,
  },
});
