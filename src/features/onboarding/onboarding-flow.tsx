import { useRouter } from 'expo-router';
import { useState } from 'react';

import { syncNow } from '@/hooks/use-sync';
import { useAppStore } from '@/state/app-state';

import { OnboardingAuthScreen } from './auth-screen';
import { ChildSetupScreen } from './child-setup-screen';
import { WelcomeScreen } from './welcome-screen';

type Step = 'welcome' | 'auth' | 'childSetup';

export function OnboardingFlow() {
  const router = useRouter();
  const setOnboardingComplete = useAppStore((state) => state.setOnboardingComplete);
  const setPendingPaywall = useAppStore((state) => state.setPendingPaywall);
  const [step, setStep] = useState<Step>('welcome');

  // The paywall belongs to a first run, not to someone signing back in — they
  // may well be paying already.
  const finish = (offerPro: boolean) => {
    setOnboardingComplete(true);
    if (offerPro) setPendingPaywall(true);
    router.replace('/activity');
  };

  // Signing in after a logout or an account deletion goes through here again.
  // Pull the account's children first: whoever already has one should not be
  // asked to invent another.
  const afterSignIn = async () => {
    await syncNow();
    if (useAppStore.getState().children.length > 0) finish(false);
    else setStep('childSetup');
  };

  if (step === 'welcome') {
    return <WelcomeScreen onContinue={() => setStep('auth')} />;
  }
  if (step === 'auth') {
    return (
      <OnboardingAuthScreen
        onBack={() => setStep('welcome')}
        onSignedIn={() => void afterSignIn()}
      />
    );
  }
  return <ChildSetupScreen onDone={() => finish(true)} />;
}
