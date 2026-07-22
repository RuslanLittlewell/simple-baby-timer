import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useEffect, useState } from 'react';
import { DynamicColorIOS, Platform, type ImageSourcePropType } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAppState } from '@/state/app-state';

export default function AppTabs() {
  const { t } = useAppState();

  const [activityIcon, setActivityIcon] = useState<ImageSourcePropType>();
  useEffect(() => {
    let alive = true;
    MaterialCommunityIcons.getImageSource('baby-face-outline', 27, '#ffffff').then((src) => {
      if (alive && src) setActivityIcon(src);
    });
    return () => {
      alive = false;
    };
  }, []);
  const colors = Colors.dark;
  const tabContentColor =
    Platform.OS === 'ios'
      ? DynamicColorIOS({ dark: colors.text, light: colors.text })
      : colors.text;

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
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
        name="index"
        contentStyle={{ backgroundColor: colors.background }}
        indicatorColor={colors.backgroundElement}
        rippleColor={colors.backgroundSelected}
        disableTransparentOnScrollEdge
        disablePopToTop
        disableScrollToTop>
        {activityIcon ? (
          <NativeTabs.Trigger.Icon src={activityIcon} selectedColor={tabContentColor} />
        ) : (
          <NativeTabs.Trigger.Icon sf="figure.child" md="child_care" selectedColor={tabContentColor} />
        )}
        <NativeTabs.Trigger.Label>{t('activity.title')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="calendar"
        contentStyle={{ backgroundColor: colors.background }}
        indicatorColor={colors.backgroundElement}
        rippleColor={colors.backgroundSelected}
        disableTransparentOnScrollEdge
        disablePopToTop
        disableScrollToTop>
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" selectedColor={tabContentColor} />
        <NativeTabs.Trigger.Label>{t('calendar.title')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="settings"
        contentStyle={{ backgroundColor: colors.background }}
        indicatorColor={colors.backgroundElement}
        rippleColor={colors.backgroundSelected}
        disableTransparentOnScrollEdge
        disablePopToTop
        disableScrollToTop>
        <NativeTabs.Trigger.Icon sf="gearshape" md="settings" selectedColor={tabContentColor} />
        <NativeTabs.Trigger.Label>{t('settings.title')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
