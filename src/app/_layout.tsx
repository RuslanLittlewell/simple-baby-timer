import { DarkTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { MiniTimer } from '@/components/mini-timer';
import { AppStateProvider } from '@/state/app-state';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DarkTheme}>
        <AppStateProvider>
          <AnimatedSplashOverlay />
          <AppTabs />
          <MiniTimer />
        </AppStateProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
