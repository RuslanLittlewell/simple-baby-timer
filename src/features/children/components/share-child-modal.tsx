import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { type Child } from '@/lib/children';
import { createInviteCode, shareChild } from '@/lib/sync';
import { useAppStore, useT } from '@/state/app-state';

type ShareStatus = 'loading' | 'ready' | 'error';

interface ShareChildModalProps {
  child: Child | null;
  onClose: () => void;
}

export function ShareChildModal({ child, onClose }: ShareChildModalProps) {
  const theme = useTheme();
  const t = useT();
  const setChildRemoteId = useAppStore((state) => state.setChildRemoteId);

  const [status, setStatus] = useState<ShareStatus>('loading');
  const [code, setCode] = useState('');

  useEffect(() => {
    if (!child) return;
    let cancelled = false;
    setStatus('loading');
    setCode('');
    (async () => {
      try {
        let remoteId = child.remoteId;
        if (!remoteId) {
          // First share: create the remote child and upload its history.
          remoteId = await shareChild(child);
          setChildRemoteId(child.id, remoteId);
        }
        const invite = await createInviteCode(remoteId);
        if (cancelled) return;
        setCode(invite);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [child, setChildRemoteId]);

  return (
    <Modal visible={!!child} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <BlurView
          experimentalBlurMethod="dimezisBlurView"
          intensity={45}
          tint="dark"
          pointerEvents="none"
          style={styles.blur}
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <ThemedText style={styles.title}>{t('children.inviteCode')}</ThemedText>

          {status === 'loading' && <ActivityIndicator color={theme.text} style={styles.spinner} />}

          {status === 'error' && (
            <ThemedText type="small" themeColor="textSecondary">
              {t('children.shareError')}
            </ThemedText>
          )}

          {status === 'ready' && (
            <>
              <ThemedText selectable style={styles.code}>
                {code}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t('children.codeHint')}
              </ThemedText>
              <Pressable
                onPress={() => Share.share({ message: code })}
                style={({ pressed }) => [
                  styles.shareButton,
                  { backgroundColor: theme.text },
                  pressed && styles.pressed,
                ]}>
                <ThemedText style={[styles.shareButtonText, { color: theme.background }]}>
                  {t('children.share')}
                </ThemedText>
              </Pressable>
            </>
          )}
        </View>
      </View>
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
  spinner: {
    marginVertical: Spacing.four,
  },
  code: {
    alignSelf: 'center',
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '700',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  shareButton: {
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
