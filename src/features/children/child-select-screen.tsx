import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuroraBackground } from '@/components/aurora-background';
import { MobileMenu } from '@/components/mobile-menu';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useProPaywall } from '@/hooks/use-pro-paywall';
import { useTheme } from '@/hooks/use-theme';
import { MAX_CHILDREN, type Child, type ChildGradientKey } from '@/lib/children';
import { useAppStore, useT } from '@/state/app-state';

import { syncNow } from '@/hooks/use-sync';
import { deleteSessionsForChild } from '@/lib/activity-store';
import { getIsSignedIn } from '@/lib/supabase';
import { leaveChild } from '@/lib/sync';

import { AddChildModal } from './components/add-child-modal';
import { AuthModal } from './components/auth-modal';
import { ChildCard } from './components/child-card';
import { EnterCodeModal } from './components/enter-code-modal';
import { ShareChildModal } from './components/share-child-modal';

type PendingAction = { type: 'share'; childId: string } | { type: 'enterCode' };

export default function ChildSelectScreen() {
  const theme = useTheme();
  const router = useRouter();
  const t = useT();
  const children = useAppStore((state) => state.children);
  const activeChildId = useAppStore((state) => state.activeChildId);
  const selectChild = useAppStore((state) => state.selectChild);
  const addChild = useAppStore((state) => state.addChild);
  const proActive = useAppStore((state) => state.proActive);
  const openPaywall = useProPaywall();
  const [adding, setAdding] = useState(false);
  const [enteringCode, setEnteringCode] = useState(false);
  const [sharingChildId, setSharingChildId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const sharingChild = children.find((child) => child.id === sharingChildId) ?? null;

  const runAction = (action: PendingAction) => {
    if (action.type === 'share') setSharingChildId(action.childId);
    else setEnteringCode(true);
  };

  // Sharing is PRO: the paywall stands in for it, and unlocking there carries
  // straight on into the share sheet.
  const requestPro = (action: PendingAction) =>
    openPaywall((unlocked) => {
      if (unlocked) runAction(action);
    });

  // Sharing needs an account — ask to sign in first, then continue.
  const requestAction = async (action: PendingAction) => {
    if (!(await getIsSignedIn())) {
      setPendingAction(action);
      return;
    }
    if (action.type === 'share' && !proActive) {
      requestPro(action);
      return;
    }
    runAction(action);
  };

  const pickChild = (child: Child) => {
    selectChild(child.id);
    router.navigate('/activity');
  };

  const saveChild = (name: string, gradientKey: ChildGradientKey, birthday: number) => {
    addChild(name, gradientKey, birthday);
    setAdding(false);
    router.navigate('/activity');
  };

  const performDelete = async (child: Child) => {
    // Remove immediately even while offline. The store keeps a persisted
    // remote tombstone so sync cannot restore a shared child in the meantime.
    useAppStore.getState().removeChild(child.id);
    try {
      await deleteSessionsForChild(child.id);
    } catch {
      // The profile is already removed; stale local history is harmless.
    }
    if (child.remoteId) leaveChild(child.remoteId).catch(() => {});
  };

  const confirmDelete = (child: Child) => {
    Alert.alert(t('children.deleteConfirm', { name: child.name }), undefined, [
      { text: t('editor.cancel'), style: 'cancel' },
      { text: t('editor.delete'), style: 'destructive', onPress: () => performDelete(child) },
    ]);
  };

  const canAdd = children.length < MAX_CHILDREN;

  return (
    <ThemedView gradient style={styles.container}>
      <AuroraBackground />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <MobileMenu />
        </View>

        <View style={styles.center}>
          {children.length === 0 && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              {t('children.empty')}
            </ThemedText>
          )}

          <View style={styles.list}>
            {children.map((child) => (
              <ChildCard
                key={child.id}
                child={child}
                isActive={child.id === activeChildId}
                onPress={() => pickChild(child)}
                onShare={() => requestAction({ type: 'share', childId: child.id })}
                shareLabel={t('children.share')}
                onDelete={() => confirmDelete(child)}
                deleteLabel={t('editor.delete')}
              />
            ))}

            {canAdd ? (
              <View style={styles.addRow}>
                <Pressable
                  accessibilityLabel={t('children.add')}
                  onPress={() => setAdding(true)}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <ThemedView type="backgroundElement" style={styles.addCard}>
                    <MaterialCommunityIcons name="plus" size={28} color={theme.text} />
                  </ThemedView>
                </Pressable>
                <Pressable
                  accessibilityLabel={t('children.enterCode')}
                  onPress={() => requestAction({ type: 'enterCode' })}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <ThemedView type="backgroundElement" style={styles.addCard}>
                    <MaterialCommunityIcons name="cloud-plus-outline" size={26} color={theme.text} />
                  </ThemedView>
                </Pressable>
              </View>
            ) : (
              <ThemedText type="small" themeColor="textSecondary" style={styles.limitText}>
                {t('children.limit')}
              </ThemedText>
            )}
          </View>
        </View>

        <AddChildModal
          visible={adding}
          onClose={() => setAdding(false)}
          onSave={saveChild}
        />
        <EnterCodeModal
          visible={enteringCode}
          onClose={() => setEnteringCode(false)}
          onJoined={() => {
            setEnteringCode(false);
            router.navigate('/activity');
          }}
        />
        <ShareChildModal child={sharingChild} onClose={() => setSharingChildId(null)} />
        <AuthModal
          visible={!!pendingAction}
          onClose={() => setPendingAction(null)}
          onSignedIn={async () => {
            const action = pendingAction;
            setPendingAction(null);
            // New device: children linked to this account appear in the list.
            await syncNow();
            if (!action) return;
            if (action.type === 'enterCode' || useAppStore.getState().proActive) {
              runAction(action);
            } else {
              requestPro(action);
            }
          }}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  header: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: Spacing.four,
  },
  center: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  emptyText: {
    textAlign: 'center',
  },
  list: {
    alignSelf: 'stretch',
    gap: Spacing.three,
  },
  addRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  addCard: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderStyle: 'dashed',
  },
  limitText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
