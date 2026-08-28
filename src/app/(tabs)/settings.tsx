import { TabFade } from '@/components/tab-fade';
import SettingsScreen from '@/features/settings/settings-screen';

export default function SettingsTab() {
  return (
    <TabFade>
      <SettingsScreen />
    </TabFade>
  );
}
