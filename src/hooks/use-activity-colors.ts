import {
  ACTIVITY_ACCENT,
  ACTIVITY_FG,
  ACTIVITY_FLOAT_ACCENT,
  ACTIVITY_GRADIENTS,
} from '@/constants/activities';
import { useAppStore } from '@/state/app-state';

export function useActivityColors() {
  const mode = useAppStore((state) => state.themeMode);
  return {
    gradients: ACTIVITY_GRADIENTS[mode],
    fg: ACTIVITY_FG[mode],
    accent: ACTIVITY_ACCENT[mode],
    float: ACTIVITY_FLOAT_ACCENT[mode],
  };
}
