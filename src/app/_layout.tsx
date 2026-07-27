import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { MiniTimer } from '@/components/mini-timer';
import { useSync } from '@/hooks/use-sync';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useSync();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DarkTheme}>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }} />
        <MiniTimer />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
