import { TabFade } from '@/components/tab-fade';
import RegimesScreen from '@/features/regimes/regimes-screen';

export default function RegimesTab() {
  return (
    <TabFade>
      <RegimesScreen />
    </TabFade>
  );
}
