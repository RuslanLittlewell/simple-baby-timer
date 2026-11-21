import { isRunningInExpoGo } from 'expo';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';

import { getLiveActivityInstallationId } from '@/lib/live-activity-sync';
import { getUserId, isSupabaseConfigured, supabase } from '@/lib/supabase';

export const backgroundPushSupported = Platform.OS === 'ios' && !isRunningInExpoGo();

export const REMOTE_CHANGE_TASK = 'babytimer.remote-change';

let lastRegistration: string | null = null;

async function registerDevice(deviceToken: string) {
  const userId = await getUserId();
  if (!userId || !deviceToken) return;
  const installationId = await getLiveActivityInstallationId();
  const key = `${userId}|${installationId}|${deviceToken}`;
  if (lastRegistration === key) return;
  lastRegistration = key;
  const { error } = await supabase.from('sync_push_devices').upsert(
    {
      user_id: userId,
      installation_id: installationId,
      platform: 'ios',
      device_token: deviceToken,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,installation_id' },
  );
  if (error) {
    lastRegistration = null;
    throw error;
  }
}

export function subscribeToBackgroundPushTokens(): () => void {
  if (!backgroundPushSupported || !isSupabaseConfigured) return () => {};
  let disposed = false;
  const register = () => {
    Notifications.getDevicePushTokenAsync()
      .then(({ data }) => {
        if (!disposed && typeof data === 'string') return registerDevice(data);
      })
      .catch(() => {});
  };
  const tokenSubscription = Notifications.addPushTokenListener(({ data }) => {
    if (!disposed && typeof data === 'string') registerDevice(data).catch(() => {});
  });
  const appStateSubscription = AppState.addEventListener('change', (next) => {
    if (next !== 'active') return;
    lastRegistration = null;
    register();
  });
  register();
  return () => {
    disposed = true;
    tokenSubscription.remove();
    appStateSubscription.remove();
  };
}
