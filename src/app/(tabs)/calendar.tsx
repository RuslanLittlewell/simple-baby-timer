import { TabFade } from '@/components/tab-fade';
import CalendarScreen from '@/features/calendar/calendar-screen';

export default function CalendarTab() {
  return (
    <TabFade>
      <CalendarScreen />
    </TabFade>
  );
}
