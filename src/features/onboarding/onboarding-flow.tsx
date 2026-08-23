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

  
  
  const finish = (offerPro: boolean) => {
    setOnboardingComplete(true);
    if (offerPro) setPendingPaywall(true);
    router.replace('/activity');
  };

  
  
  
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
