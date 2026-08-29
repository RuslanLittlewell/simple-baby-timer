import { TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

import { BOTTLE_CONTENTS, BREAST_SIDES, SLEEP_PLACES, type SettlingMethod } from '../../pro-details';
import { sanitizeVolumeInput } from './helpers';
import { SelectField } from './select-field';
import { SettlingMethodsField } from './settling-methods-field';
import { styles } from './styles';
import {
  type BottleContent,
  type BreastSide,
  type FeedingMode,
  type ManualKind,
  type SectionTheme,
  type SleepPlace,
  type TranslatedSectionProps,
} from './types';

interface ProParametersProps extends TranslatedSectionProps {
  kind: ManualKind;
  sleepPlace: SleepPlace;
  feedingMode: FeedingMode;
  breastSide: BreastSide;
  bottleContent: BottleContent;
  volume: string;
  settlingMethods: SettlingMethod[];
  theme: SectionTheme;
  onSleepPlaceChange: (value: SleepPlace) => void;
  onFeedingModeChange: (value: FeedingMode) => void;
  onBreastSideChange: (value: BreastSide) => void;
  onBottleContentChange: (value: BottleContent) => void;
  onVolumeChange: (value: string) => void;
  onSettlingMethodToggle: (value: SettlingMethod) => void;
}

export function ProParameters(props: ProParametersProps) {
  const sleepOptions = SLEEP_PLACES.map((item) => ({ value: item, label: props.t(`pro.${item}`) }));
  const feedingOptions = (['breast', 'bottle'] as const).map((item) => ({
    value: item,
    label: props.t(`pro.${item}`),
  }));
  const breastOptions = BREAST_SIDES.map((item) => ({ value: item, label: props.t(`pro.${item}`) }));
  const bottleOptions = BOTTLE_CONTENTS.map((item) => ({ value: item, label: props.t(`pro.${item}`) }));

  return (
    <View style={styles.proBlock}>
      <ThemedText type="smallBold">{props.t('editor.proParameters')}</ThemedText>

      {props.kind === 'settling' && (
        <SettlingMethodsField
          methods={props.settlingMethods}
          theme={props.theme}
          onToggle={props.onSettlingMethodToggle}
          t={props.t}
        />
      )}

      {props.kind === 'sleep' && (
        <SelectField
          label={props.t('manual.place')}
          value={props.sleepPlace}
          options={sleepOptions}
          onSelect={(value) => props.onSleepPlaceChange(value as SleepPlace)}
        />
      )}

      {props.kind === 'feeding' && (
        <>
          <SelectField
            label={props.t('manual.feedingType')}
            value={props.feedingMode}
            options={feedingOptions}
            onSelect={(value) => props.onFeedingModeChange(value as FeedingMode)}
          />
          {props.feedingMode === 'breast' ? (
            <SelectField
              label={props.t('manual.side')}
              value={props.breastSide}
              options={breastOptions}
              onSelect={(value) => props.onBreastSideChange(value as BreastSide)}
            />
          ) : (
            <>
              <SelectField
                label={props.t('manual.content')}
                value={props.bottleContent}
                options={bottleOptions}
                onSelect={(value) => props.onBottleContentChange(value as BottleContent)}
              />
              <View style={styles.field}>
                <ThemedText type="small" themeColor="textSecondary">
                  {props.t('pro.volume')}
                </ThemedText>
                <TextInput
                  value={props.volume}
                  onChangeText={(value) => props.onVolumeChange(sanitizeVolumeInput(value))}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={props.theme.textSecondary}
                  style={[
                    styles.input,
                    { color: props.theme.text, backgroundColor: props.theme.backgroundElement },
                  ]}
                />
              </View>
            </>
          )}
        </>
      )}
    </View>
  );
}
