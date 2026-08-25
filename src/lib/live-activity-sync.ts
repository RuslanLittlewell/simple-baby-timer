import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LiveActivity from 'expo-live-activity';
import { Platform } from 'react-native';

import { type LanguageCode } from '@/i18n';
import { getUserId, isSupabaseConfigured, supabase } from '@/lib/supabase';

const INSTALLATION_KEY = 'babytimer.live-activity.installation.v1';
const ACTIVITY_NAME_PREFIX = 'babytimer';

let installationIdPromise: Promise<string> | null = null;
let deviceRegistration: Promise<void> | null = null;

const randomId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;

export function getLiveActivityInstallationId(): Promise<string> {
  if (installationIdPromise) return installationIdPromise;
  installationIdPromise = (async () => {
    const saved = await AsyncStorage.getItem(INSTALLATION_KEY);
    if (saved) return saved;
    const created = randomId();
    await AsyncStorage.setItem(INSTALLATION_KEY, created);
    return created;
  })();
  return installationIdPromise;
}

async function registerDevice(pushToStartToken: string, locale: LanguageCode) {
  const userId = await getUserId();
  if (!userId) return;
  const installationId = await getLiveActivityInstallationId();
  await supabase.from('live_activity_devices').upsert(
    {
      user_id: userId,
      installation_id: installationId,
      push_to_start_token: pushToStartToken,
      locale,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,installation_id' },
  );
}

function parseActivityName(name: string) {
  const [prefix, childId, track] = name.split('|');
  if (
    prefix !== ACTIVITY_NAME_PREFIX ||
    !childId ||
    (track !== 'session' && track !== 'feeding')
  ) {
    return null;
  }
  return { childId, track } as const;
}

async function registerActivityToken(
  activityName: string,
  activityId: string,
  updateToken: string,
) {
  const parsed = parseActivityName(activityName);
  const userId = await getUserId();
  if (!parsed || !userId) return;
  const installationId = await getLiveActivityInstallationId();
  await supabase.from('live_activity_instances').upsert(
    {
      user_id: userId,
      installation_id: installationId,
      child_id: parsed.childId,
      track: parsed.track,
      activity_id: activityId,
      update_token: updateToken,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,installation_id,child_id,track' },
  );
}

export function subscribeToLiveActivityPushTokens(locale: LanguageCode) {
  if (Platform.OS !== 'ios' || !isSupabaseConfigured) return () => {};

  const startSubscription = LiveActivity.addActivityPushToStartTokenListener(
    ({ activityPushToStartToken }) => {
      if (activityPushToStartToken) {
        deviceRegistration = registerDevice(activityPushToStartToken, locale);
        deviceRegistration.catch(() => {});
      }
    },
  );
  const updateSubscription = LiveActivity.addActivityTokenListener(
    ({ activityID, activityName, activityPushToken }) => {
      const register = async () => {
        if (deviceRegistration) await deviceRegistration.catch(() => {});
        else await new Promise((resolve) => setTimeout(resolve, 750));
        await registerActivityToken(activityName, activityID, activityPushToken);
      };
      register().catch(() => {});
    },
  );

  return () => {
    startSubscription?.remove();
    updateSubscription?.remove();
  };
}

export async function dispatchLiveActivityPush(
  action: 'start' | 'end',
  childId: string,
  track: 'session' | 'feeding',
  payload?: { kind: string; startedAt: number },
) {
  if (Platform.OS !== 'ios' || !isSupabaseConfigured) return;
  const installationId = await getLiveActivityInstallationId();
  const { error } = await supabase.functions.invoke('live-activity-push', {
    body: { action, childId, track, installationId, ...payload },
  });
  if (error) throw error;
}
