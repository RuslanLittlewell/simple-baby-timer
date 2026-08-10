import {
  NunitoSans_400Regular,
  NunitoSans_500Medium,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito-sans';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { MiniTimer } from '@/components/mini-timer';
import { OnboardingAuthScreen } from '@/features/onboarding/auth-screen';
import { PaywallModal } from '@/features/onboarding/components/paywall-modal';
import { syncNow, useSync } from '@/hooks/use-sync';
import { useTabHistory } from '@/hooks/use-tab-history';
import { useAppStore } from '@/state/app-state';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useSync();
  useTabHistory();
  const pendingPaywall = useAppStore((state) => state.pendingPaywall);
  const setPendingPaywall = useAppStore((state) => state.setPendingPaywall);
  const authRequired = useAppStore((state) => state.authRequired);
  const setAuthRequired = useAppStore((state) => state.setAuthRequired);
  const onboardingComplete = useAppStore((state) => state.onboardingComplete);
  const [fontsLoaded, fontError] = useFonts({
    NunitoSans_400Regular,
    NunitoSans_500Medium,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
  });

  // The native splash is still up (it is only hidden by the overlay below), so
  // holding here avoids a frame of system font. A load failure falls through
  // rather than freezing the app on the splash.
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DarkTheme}>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }} />
        <MiniTimer />
        {/* Buying anything needs an account, and a native modal would sit on
            top of the gate below. */}
        <PaywallModal
          visible={pendingPaywall && !authRequired}
          onClose={() => setPendingPaywall(false)}
        />
        {/* The account behind a finished setup is gone or signed out: the app
            needs one, so sign-in covers everything until it is back. During
            onboarding the flow asks for it on its own. */}
        {onboardingComplete && authRequired && (
          <View style={styles.authGate}>
            <OnboardingAuthScreen
              onSignedIn={() => {
                setAuthRequired(false);
                syncNow();
              }}
            />
          </View>
        )}
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  // Above the tabs and the floating mini timer, so nothing of the app is
  // reachable while the account is missing.
  authGate: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
});
