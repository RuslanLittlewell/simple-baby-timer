import {
  NunitoSans_400Regular,
  NunitoSans_500Medium,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
  useFonts,
} from "@expo-google-fonts/nunito-sans";
import {
  GoogleSansFlex_400Regular,
  GoogleSansFlex_500Medium,
  GoogleSansFlex_600SemiBold,
  GoogleSansFlex_700Bold,
} from "@expo-google-fonts/google-sans-flex";
import { DarkTheme, ThemeProvider } from "expo-router/react-navigation";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Appearance, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { WheelSheetHost } from "@/components/wheel-sheet";
import { OnboardingAuthScreen } from "@/features/onboarding/auth-screen";
import { PaywallModal } from "@/features/onboarding/components/paywall-modal";
import { usePersonalRegimeRefresh } from "@/hooks/use-personal-regime-refresh";
import { useRegimeDayAdjustment } from "@/hooks/use-regime-day-adjustment";
import { useRegimeReminders } from "@/hooks/use-regime-reminders";
import { useSync } from "@/hooks/use-sync";
import { useTabHistory } from "@/hooks/use-tab-history";
import { configurePurchases } from "@/lib/purchases";
import { useAppStore } from "@/state/app-state";

SplashScreen.preventAutoHideAsync();

configurePurchases();

export default function RootLayout() {
  useSync();
  usePersonalRegimeRefresh();
  useRegimeDayAdjustment();
  useRegimeReminders();
  useTabHistory();
  const router = useRouter();
  const pendingPaywall = useAppStore((state) => state.pendingPaywall);
  const setPendingPaywall = useAppStore((state) => state.setPendingPaywall);
  const authRequired = useAppStore((state) => state.authRequired);
  const onboardingComplete = useAppStore((state) => state.onboardingComplete);
  const themeMode = useAppStore((state) => state.themeMode);

  // The native tab bar's glass follows the system style, not the in-app theme.
  useEffect(() => {
    Appearance.setColorScheme(themeMode);
  }, [themeMode]);
  const [fontsLoaded, fontError] = useFonts({
    NunitoSans_400Regular,
    NunitoSans_500Medium,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
    GoogleSansFlex_400Regular,
    GoogleSansFlex_500Medium,
    GoogleSansFlex_600SemiBold,
    GoogleSansFlex_700Bold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <WheelSheetHost>
        <ThemeProvider value={DarkTheme}>
          <AnimatedSplashOverlay />
          <Stack screenOptions={{ headerShown: false }} />

          <PaywallModal
            visible={pendingPaywall && !authRequired}
            onClose={() => setPendingPaywall(false)}
          />

          {onboardingComplete && authRequired && (
            <View style={styles.authGate}>
              <OnboardingAuthScreen
                onSignedIn={() => {
                  router.replace("/children");
                }}
              />
            </View>
          )}
        </ThemeProvider>
      </WheelSheetHost>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  authGate: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
  },
});
