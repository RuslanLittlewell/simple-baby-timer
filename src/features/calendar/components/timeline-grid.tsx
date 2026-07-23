import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

import { GUTTER } from '../constants';
import { pad2 } from '../helpers';

export const TimelineGrid = memo(function TimelineGrid({
  hourHeight,
  step,
  hourLineColor,
  minorLineColor,
}: {
  hourHeight: number;
  step: number;
  hourLineColor: string;
  minorLineColor: string;
}) {
  const marks: { top: number; label: string }[] = [];
  if (step < 60) {
    for (let h = 0; h < 24; h++) {
      for (let m = step; m < 60; m += step) {
        marks.push({ top: ((h * 60 + m) / 60) * hourHeight, label: pad2(m) });
      }
    }
  }

  return (
    <>
      {Array.from({ length: 25 }).map((_, h) => (
        <View
          key={`hl-${h}`}
          pointerEvents="none"
          style={[styles.hourLine, { top: h * hourHeight, backgroundColor: hourLineColor }]}
        />
      ))}
      {Array.from({ length: 24 }).map((_, h) => (
        <View
          key={`ha-${h}`}
          pointerEvents="none"
          style={[styles.hourLabel, { top: h * hourHeight - 8 }]}>
          <ThemedText style={styles.hourNum}>{pad2(h)}</ThemedText>
          <ThemedText style={styles.hourSup} themeColor="textSecondary">
            00
          </ThemedText>
        </View>
      ))}
      {marks.map((mk) => (
        <View key={`m-${mk.top}`} pointerEvents="none">
          <View style={[styles.minorLine, { top: mk.top, backgroundColor: minorLineColor }]} />
          <ThemedText
            style={[styles.minorLabel, { top: mk.top - 8 }]}
            themeColor="textSecondary">
            {mk.label}
          </ThemedText>
        </View>
      ))}
    </>
  );
});

const styles = StyleSheet.create({
  hourLine: {
    position: 'absolute',
    left: GUTTER,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  minorLine: {
    position: 'absolute',
    left: GUTTER,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  hourLabel: {
    position: 'absolute',
    left: 0,
    width: GUTTER - 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  hourNum: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '600',
  },
  hourSup: {
    fontSize: 9,
    lineHeight: 11,
    marginLeft: 1,
  },
  minorLabel: {
    position: 'absolute',
    left: 0,
    width: GUTTER - 8,
    textAlign: 'right',
    fontSize: 9,
    lineHeight: 11,
  },
});
