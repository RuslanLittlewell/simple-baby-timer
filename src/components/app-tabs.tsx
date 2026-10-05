import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { DynamicColorIOS, Platform } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAppStore, useT } from '@/state/app-state';

export default function AppTabs() {
  const t = useT();
  const themeMode = useAppStore((state) => state.themeMode);

  const colors = Colors[themeMode];
  const tabContentColor =
    Platform.OS === 'ios'
      ? DynamicColorIOS({ dark: colors.text, light: colors.text })
      : colors.text;

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.navigationActive}
      tintColor={tabContentColor}
      iconColor={{ default: tabContentColor, selected: tabContentColor }}
      labelStyle={{
        default: { color: tabContentColor },
        selected: { color: tabContentColor },
      }}
      labelVisibilityMode="labeled"
      rippleColor={colors.backgroundSelected}
      disableTransparentOnScrollEdge>
      <NativeTabs.Trigger
        name="activity"
        disablePopToTop
        disableScrollToTop
        disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Icon
          src={<NativeTabs.Trigger.VectorIcon family={MaterialCommunityIcons} name="timer-outline" />}
          selectedColor={tabContentColor}
        />
        <NativeTabs.Trigger.Label>{t('activity.title')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="calendar"
        disablePopToTop
        disableScrollToTop
        disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Icon
          src={<NativeTabs.Trigger.VectorIcon family={MaterialCommunityIcons} name="calendar-month" />}
          selectedColor={tabContentColor}
        />
        <NativeTabs.Trigger.Label>{t('calendar.title')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="regimes"
        disablePopToTop
        disableScrollToTop
        disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Icon
          src={<NativeTabs.Trigger.VectorIcon family={MaterialCommunityIcons} name="clock-outline" />}
          selectedColor={tabContentColor}
        />
        <NativeTabs.Trigger.Label>{t('regimes.title')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="settings"
        disablePopToTop
        disableScrollToTop
        disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Icon
          src={<NativeTabs.Trigger.VectorIcon family={MaterialCommunityIcons} name="cog-outline" />}
          selectedColor={tabContentColor}
        />
        <NativeTabs.Trigger.Label>{t('settings.title')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
