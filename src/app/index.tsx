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

  // Exactly one child means there is nothing to choose — go straight in. With
  // none at all the activity screen has nothing to show, so the list (which can
  // add one) is the honest destination.
  const goStraightToActivity = onboardingComplete && children.length === 1;

  useEffect(() => {
    if (!goStraightToActivity) return;
    // Make sure the sole child (if any) is actually selected before landing
    // on the activity screen, which otherwise has nothing to show.
    const onlyChild = children[0];
    if (onlyChild && activeChildId !== onlyChild.id) selectChild(onlyChild.id);
  }, [goStraightToActivity, children, activeChildId, selectChild]);

  if (!onboardingComplete) return <OnboardingFlow />;
  if (goStraightToActivity) return <Redirect href="/activity" />;
  return <ChildSelectScreen />;
}
