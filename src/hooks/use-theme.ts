

import { Colors } from '@/constants/theme';
import { useAppStore } from '@/state/app-state';

export function useTheme() {
  const mode = useAppStore((state) => state.themeMode);
  return Colors[mode];
}
