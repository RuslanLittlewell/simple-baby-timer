import { Redirect } from 'expo-router';
import { useEffect } from 'react';

import ChildSelectScreen from '@/features/children/child-select-screen';
import { OnboardingFlow } from '@/features/onboarding/onboarding-flow';
import { useAppStore } from '@/state/app-state';

export default function Index() {
  const onboardingComplete = useAppStore((state) => state.onboardingComplete);
  const children = useAppStore((state) => state.children);
  const activeChildId = useAppStore((state) => state.activeChildId);
  const selectChild = useAppStore((state) => state.selectChild);

  
  
  
  const goStraightToActivity = onboardingComplete && children.length === 1;

  useEffect(() => {
    if (!goStraightToActivity) return;
    
    
    const onlyChild = children[0];
    if (onlyChild && activeChildId !== onlyChild.id) selectChild(onlyChild.id);
  }, [goStraightToActivity, children, activeChildId, selectChild]);

  if (!onboardingComplete) return <OnboardingFlow />;
  if (goStraightToActivity) return <Redirect href="/activity" />;
  return <ChildSelectScreen />;
}
