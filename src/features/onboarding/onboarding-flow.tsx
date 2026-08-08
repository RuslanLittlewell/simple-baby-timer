import { useRouter } from 'expo-router';
import { useState } from 'react';

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

  const finish = () => {
    setOnboardingComplete(true);
    setPendingPaywall(true);
    router.replace('/activity');
  };

  if (step === 'welcome') {
    return <WelcomeScreen onContinue={() => setStep('auth')} />;
  }
  if (step === 'auth') {
    return (
      <OnboardingAuthScreen
        onBack={() => setStep('welcome')}
        onSignedIn={() => setStep('childSetup')}
      />
    );
  }
  return <ChildSetupScreen onDone={finish} />;
}
