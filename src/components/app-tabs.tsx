import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import { DynamicColorIOS, Platform } from 'react-native';

import { Colors } from '@/constants/theme';
import { useT } from '@/state/app-state';

export default function AppTabs() {
  const t = useT();

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
      <NativeTabs.Trigger name="index" disablePopToTop disableScrollToTop>
        <NativeTabs.Trigger.TabBar
          backgroundColor={colors.background}
          iconColor={tabContentColor}
          disableTransparentOnScrollEdge
        />
        <Icon
          src={<VectorIcon family={MaterialCommunityIcons} name="baby-face-outline" />}
          selectedColor={tabContentColor}
        />
        <Label>{t('activity.title')}</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="calendar" disablePopToTop disableScrollToTop>
        <NativeTabs.Trigger.TabBar
          backgroundColor={colors.background}
          iconColor={tabContentColor}
          disableTransparentOnScrollEdge
        />
        <Icon
          src={<VectorIcon family={MaterialCommunityIcons} name="calendar-month" />}
          selectedColor={tabContentColor}
        />
        <Label>{t('calendar.title')}</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings" disablePopToTop disableScrollToTop>
        <NativeTabs.Trigger.TabBar
          backgroundColor={colors.background}
          iconColor={tabContentColor}
          disableTransparentOnScrollEdge
        />
        <Icon
          src={<VectorIcon family={MaterialCommunityIcons} name="cog-outline" />}
          selectedColor={tabContentColor}
        />
        <Label>{t('settings.title')}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
