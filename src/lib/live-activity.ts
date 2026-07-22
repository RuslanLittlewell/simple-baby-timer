import * as LiveActivity from 'expo-live-activity';
import { Platform } from 'react-native';

import { ACTIVITY_ACCENT } from '@/constants/activities';
import { type ActivityKind } from '@/lib/notifications';

/**
 * Live Activity для Dynamic Island и экрана блокировки.
 *
 * В `expo-live-activity` таймер задаётся датой окончания и идёт на убывание,
 * поэтому в островке показываем не «сколько прошло», а сколько осталось до
 * напоминания — ровно тот же дедлайн, на который заведено уведомление.
 *
 * Только iOS 16.2+ и только в dev build / релизе: в Expo Go нативного модуля нет.
 */

const ICONS: Record<ActivityKind, string> = {
  sleep: 'la-sleep',
  feeding: 'la-feed',
  awake: 'la-awake',
};

const TINTS: Record<ActivityKind, string> = {
  sleep: ACTIVITY_ACCENT.sleep,
  feeding: ACTIVITY_ACCENT.feed,
  awake: ACTIVITY_ACCENT.awake,
};

export const liveActivitySupported = Platform.OS === 'ios';

type Labels = {
  /** Название активности, крупная строка. */
  title: string;
  /** Вторая строка — например, время старта. */
  subtitle: string;
};

/**
 * Дорожки идут параллельно: кормление не должно гасить островок сна/бодрствования.
 * ActivityKit разрешает несколько активностей сразу и сам решает, какую показать
 * в свёрнутом островке; на экране блокировки видны обе.
 */
export type LiveSlot = 'session' | 'feeding';

const activeIds: Record<LiveSlot, string | null> = { session: null, feeding: null };
/** Подписи активности — чтобы при остановке не тащить язык через все вызовы. */
const activeLabels: Record<LiveSlot, Labels | null> = { session: null, feeding: null };

const stateFor = (kind: ActivityKind, deadline: number, labels: Labels): LiveActivity.LiveActivityState => ({
  title: labels.title,
  subtitle: labels.subtitle,
  progressBar: { date: deadline },
  imageName: ICONS[kind],
  dynamicIslandImageName: ICONS[kind],
});

/**
 * Запускает Live Activity на своей дорожке. Прошлую на этой же дорожке закрывает,
 * соседнюю не трогает.
 * @param deadline момент срабатывания напоминания (epoch ms) — до него идёт отсчёт.
 */
export function startLiveActivity(
  slot: LiveSlot,
  kind: ActivityKind,
  deadline: number,
  labels: Labels,
) {
  if (!liveActivitySupported) return;
  stopLiveActivity(slot);
  activeLabels[slot] = labels;
  try {
    activeIds[slot] =
      LiveActivity.startActivity(stateFor(kind, deadline, labels), {
        timerType: 'digital',
        backgroundColor: '#000000',
        titleColor: '#FFFFFF',
        subtitleColor: '#B0B4BA',
        progressViewTint: TINTS[kind],
        progressViewLabelColor: '#FFFFFF',
        deepLinkUrl: 'babytimer://',
      }) ?? null;
  } catch {
    // Пользователь мог запретить Live Activities — таймер в приложении это не ломает.
    activeIds[slot] = null;
  }
}

/** Убирает Live Activity одной дорожки из островка и с экрана блокировки. */
export function stopLiveActivity(slot: LiveSlot) {
  const id = activeIds[slot];
  if (!liveActivitySupported || !id) return;
  try {
    // Без progressBar — таймер в финальном состоянии уже не нужен.
    LiveActivity.stopActivity(id, {
      title: activeLabels[slot]?.title ?? '',
      subtitle: activeLabels[slot]?.subtitle,
    });
  } catch {
    // Активность могла быть уже закрыта системой или свайпом.
  }
  activeIds[slot] = null;
  activeLabels[slot] = null;
}
