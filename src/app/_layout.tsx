import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { MiniTimer } from '@/components/mini-timer';
import { PaywallModal } from '@/features/onboarding/components/paywall-modal';
import { useSync } from '@/hooks/use-sync';
import { useAppStore } from '@/state/app-state';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useSync();
  const pendingPaywall = useAppStore((state) => state.pendingPaywall);
  const setPendingPaywall = useAppStore((state) => state.setPendingPaywall);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DarkTheme}>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }} />
        <MiniTimer />
        <PaywallModal visible={pendingPaywall} onClose={() => setPendingPaywall(false)} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
