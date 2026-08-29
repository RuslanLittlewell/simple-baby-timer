import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { WheelSelect } from '@/components/wheel-select';

import { BOTTLE_CONTENTS, BREAST_SIDES, SETTLING_METHODS, SLEEP_PLACES, type SettlingMethod } from '../../pro-details';
import { styles } from './styles';
import {
  type BottleContent,
  type BreastSide,
  type EditableProKind,
  type EditorTheme,
  type FeedingMode,
  type SleepPlace,
  type TranslatedEditorProps,
} from './types';

interface EditableProSectionProps extends TranslatedEditorProps {
  kind: Exclude<EditableProKind, null>;
  methods: SettlingMethod[];
  sleepPlace: SleepPlace;
  feedingMode: FeedingMode;
  breastSide: BreastSide;
  bottleContent: BottleContent;
  theme: EditorTheme;
  onMethodToggle: (value: SettlingMethod) => void;
  onSleepPlaceChange: (value: SleepPlace) => void;
  onFeedingModeChange: (value: FeedingMode) => void;
  onBreastSideChange: (value: BreastSide) => void;
  onBottleContentChange: (value: BottleContent) => void;
}

export function EditableProSection(props: EditableProSectionProps) {
  const sleepOptions = SLEEP_PLACES.map((item) => ({ value: item, label: props.t(`pro.${item}`) }));
  const feedingOptions = (['breast', 'bottle'] as const).map((item) => ({ value: item, label: props.t(`pro.${item}`) }));
  const breastOptions = BREAST_SIDES.map((item) => ({ value: item, label: props.t(`pro.${item}`) }));
  const bottleOptions = BOTTLE_CONTENTS.map((item) => ({ value: item, label: props.t(`pro.${item}`) }));

  return (
    <View style={styles.proSection}>
      <ThemedText type="small" themeColor="textSecondary">
        {props.t('editor.proParameters')}
      </ThemedText>
      {props.kind === 'settling' && (
        <View style={styles.multiOptions}>
          {SETTLING_METHODS.map((method) => {
            const selected = props.methods.includes(method);
            const backgroundColor = selected ? props.theme.backgroundSelected : props.theme.backgroundElement;
            const borderColor = selected ? props.theme.text : props.theme.border;
            return (
              <Pressable
                key={method}
                onPress={() => props.onMethodToggle(method)}
                style={[styles.multiOption, { backgroundColor, borderColor }]}>
                <ThemedText type="small">{props.t(`pro.${method}`)}</ThemedText>
              </Pressable>
            );
          })}
        </View>
      )}
      {props.kind === 'sleep' && (
        <View style={styles.field}>
          <WheelSelect value={props.sleepPlace} options={sleepOptions} onSelect={(value) => props.onSleepPlaceChange(value as SleepPlace)} />
        </View>
      )}
      {props.kind === 'feeding' && (
        <>
          <View style={styles.field}>
            <WheelSelect value={props.feedingMode} options={feedingOptions} onSelect={(value) => props.onFeedingModeChange(value as FeedingMode)} />
          </View>
          <View style={styles.field}>
            {props.feedingMode === 'breast' ? (
              <WheelSelect value={props.breastSide} options={breastOptions} onSelect={(value) => props.onBreastSideChange(value as BreastSide)} />
            ) : (
              <WheelSelect value={props.bottleContent} options={bottleOptions} onSelect={(value) => props.onBottleContentChange(value as BottleContent)} />
            )}
          </View>
        </>
      )}
    </View>
  );
}
