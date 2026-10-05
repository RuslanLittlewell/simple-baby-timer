import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type ActivityKind = 'settling' | 'sleep' | 'feeding' | 'awake';



// Android channels are immutable once created, so vibration needs a new channel id.
const ANDROID_CHANNEL = 'reminders-vibrate';
// Bundled by the expo-notifications plugin. A silent alert sound still brings
// the alert's vibration on iOS, so reminders buzz without waking the baby.
const SILENT_SOUND = 'reminder_silent.wav';
const VIBRATION_PATTERN = [0, 250, 250, 250];

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
      sound: null,
      enableVibrate: true,
      vibrationPattern: VIBRATION_PATTERN,
    });
  }

  const seconds = Math.max(1, Math.round(delaySeconds));
  return Notifications.scheduleNotificationAsync({
    content: {
      ...message,
      
      
      
      sound: SILENT_SOUND,
      vibrate: VIBRATION_PATTERN,
      interruptionLevel: 'active',
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
