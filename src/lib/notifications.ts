import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type ActivityKind = 'sleep' | 'feeding' | 'awake';

const ANDROID_CHANNEL = 'reminders';

let handlerConfigured = false;

export function configureNotificationHandler() {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleActivityNotification(
  message: { title: string; body: string },
  delaySeconds: number,
): Promise<string | null> {
  const granted = await ensureNotificationPermissions();
  if (!granted) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
      name: 'Напоминания',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const seconds = Math.max(1, Math.round(delaySeconds));
  return Notifications.scheduleNotificationAsync({
    content: {
      ...message,
      sound: true,
      interruptionLevel: 'timeSensitive',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
      channelId: Platform.OS === 'android' ? ANDROID_CHANNEL : undefined,
    },
  });
}

export async function cancelReminder(id: string | null | undefined) {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {

  }
}
