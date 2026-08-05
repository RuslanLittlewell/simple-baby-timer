import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useKindStyle } from '../constants';
import { type RegimeStep, type RegimeVariant } from '../types';

interface RegimeCycleProps {
  variant: RegimeVariant;
  onSelect: (step: RegimeStep) => void;
}

export function RegimeCycle({ variant, onSelect }: RegimeCycleProps) {
  const theme = useTheme();
  const kindStyle = useKindStyle();
  return (
    <View style={styles.list}>
      {variant.steps.map((step, index) => {
        const style = kindStyle[step.kind];
        return (
          <Pressable
            key={index}
            accessibilityLabel={step.action}
            onPress={() => onSelect(step)}
            style={({ pressed }) => pressed && styles.pressed}>
            <ThemedView type="backgroundElement" style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: style.colors[0] }]}>
                <MaterialCommunityIcons name={style.icon} size={18} color={style.fg} />
              </View>
              <View style={styles.text}>
                <ThemedText type="smallBold">{step.action}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  {step.time}
                </ThemedText>
              </View>
              <MaterialCommunityIcons name="information-outline" size={18} color={theme.textSecondary} />
            </ThemedView>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.6,
  },
});
