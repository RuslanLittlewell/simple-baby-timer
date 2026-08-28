import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WheelField } from '@/components/wheel-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/app-state';

interface Props { label: string; timeLabel: string; hint: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; value: number; enabled: boolean; expanded: boolean; onToggle: () => void; onEnabledChange: (enabled: boolean) => void; onCommit: (value: number) => void }
const timerDate = (minutes: number) => { const date = new Date(); date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0); return date; };
const timerText = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export function ReminderCard({ label, timeLabel, hint, icon, value, enabled, expanded, onToggle, onEnabledChange, onCommit }: Props) {
  const theme = useTheme(); const mode = useAppStore((s) => s.themeMode);
  const rotation = useSharedValue(expanded ? 90 : 0);
  useEffect(() => { rotation.value = withTiming(expanded ? 90 : 0, { duration: 220, easing: Easing.out(Easing.cubic) }); }, [expanded, rotation]);
  const chevronStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
  return <Animated.View layout={LinearTransition.duration(260).easing(Easing.out(Easing.cubic))}>
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded }} accessibilityLabel={label} onPress={onToggle} style={({ pressed }) => [styles.titleButton, pressed && styles.pressed]}>
          <MaterialCommunityIcons name={icon} size={30} color={theme.text} /><ThemedText style={styles.title}>{label}</ThemedText>
        </Pressable>
        <View style={styles.switchSlot}><Switch accessibilityLabel={label} value={enabled} onValueChange={onEnabledChange} trackColor={{ false: theme.border, true: '#C4B5FD' }} style={[styles.switch, mode === 'light' && styles.lightSwitchBorder]} /></View>
        <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onToggle} hitSlop={12} style={styles.chevronButton}><Animated.View style={chevronStyle}><MaterialCommunityIcons name="chevron-right" size={27} color={theme.textSecondary} /></Animated.View></Pressable>
      </View>
      {expanded && <Animated.View entering={FadeIn.duration(240).easing(Easing.out(Easing.cubic))} exiting={FadeOut.duration(170).easing(Easing.in(Easing.cubic))} style={[styles.details, { borderTopColor: theme.border }]}>
        <View style={styles.timeRow}><ThemedText type="smallBold">{timeLabel}</ThemedText><WheelField mode="time" value={timerDate(value)} displayText={timerText(value)} onChange={(date) => onCommit(date.getHours() * 60 + date.getMinutes())} style={[styles.timeInput, { backgroundColor: theme.background, borderColor: theme.border }]} textStyle={styles.timeInputText} /></View>
        <ThemedText type="small" themeColor="textSecondary">{hint}</ThemedText>
      </Animated.View>}
    </ThemedView>
  </Animated.View>;
}
const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, overflow: 'hidden' },
  header: { minHeight: 76, paddingHorizontal: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  titleButton: { minHeight: 76, flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.three }, title: { flex: 1, fontSize: 16, lineHeight: 22, fontWeight: 700 },
  details: { borderTopWidth: 1, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, gap: Spacing.two },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three },
  timeInput: { minWidth: 116, alignItems: 'center', paddingHorizontal: Spacing.three, paddingVertical: 10, borderWidth: 1, borderRadius: 14 },
  timeInputText: { fontVariant: ['tabular-nums'], fontSize: 16, lineHeight: 22 },
  switchSlot: { alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center' }, chevronButton: { alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center' },
  switch: { transform: [{ scale: 0.86 }] }, lightSwitchBorder: { borderRadius: 16, boxShadow: 'inset 0 0 0 2px #C4B5FD' }, pressed: { opacity: 0.7 },
});
