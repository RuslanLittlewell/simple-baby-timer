import { TabFade } from '@/components/tab-fade';
import ActivityScreen from '@/features/activity/activity-screen';

export default function ActivityTab() {
  return (
    <TabFade>
      <ActivityScreen />
    </TabFade>
  );
}
