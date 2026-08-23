import {
  NunitoSans_400Regular,
  NunitoSans_500Medium,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito-sans';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { OnboardingAuthScreen } from '@/features/onboarding/auth-screen';
import { WheelSheetHost } from '@/components/wheel-sheet';
import { PaywallModal } from '@/features/onboarding/components/paywall-modal';
import { useSync } from '@/hooks/use-sync';
import { configurePurchases } from '@/lib/purchases';
import { useTabHistory } from '@/hooks/use-tab-history';
import { useAppStore } from '@/state/app-state';

SplashScreen.preventAutoHideAsync();



configurePurchases();

export default function RootLayout() {
  useSync();
  useTabHistory();
  const router = useRouter();
  const pendingPaywall = useAppStore((state) => state.pendingPaywall);
  const setPendingPaywall = useAppStore((state) => state.setPendingPaywall);
  const authRequired = useAppStore((state) => state.authRequired);
  const onboardingComplete = useAppStore((state) => state.onboardingComplete);
  const [fontsLoaded, fontError] = useFonts({
    NunitoSans_400Regular,
    NunitoSans_500Medium,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
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
                
                
                
                
                router.replace('/children');
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
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
});
