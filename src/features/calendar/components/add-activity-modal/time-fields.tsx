import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { WheelField } from '@/components/wheel-field';

import { fmtTime } from '../../helpers';
import { DayStepper } from '../day-stepper';
import { timeInputAsDate } from './helpers';
import { styles } from './styles';
import { type SectionTheme, type TranslatedSectionProps } from './types';

interface TimeFieldsProps extends TranslatedSectionProps {
  eventKind: boolean;
  startInput: string;
  endInput: string;
  startDayMs: number;
  endDayMs: number;
  weekdays: readonly string[];
  theme: SectionTheme;
  onStartInputChange: (value: string) => void;
  onEndInputChange: (value: string) => void;
  onStartDayChange: (value: number) => void;
  onEndDayChange: (value: number) => void;
}

export function TimeFields(props: TimeFieldsProps) {
  const timeBoxStyle = [styles.timeInputBox, { backgroundColor: props.theme.backgroundElement }];
  const timeTextStyle = [styles.timeInputText, { color: props.theme.text }];

  return (
    <View style={styles.timeRow}>
      <TimeField
        label={props.t('editor.start')}
        input={props.startInput}
        dayMs={props.startDayMs}
        weekdays={props.weekdays}
        theme={props.theme}
        timeBoxStyle={timeBoxStyle}
        timeTextStyle={timeTextStyle}
        onInputChange={props.onStartInputChange}
        onDayChange={props.onStartDayChange}
        t={props.t}
      />
      {!props.eventKind && (
        <TimeField
          label={props.t('editor.end')}
          input={props.endInput}
          dayMs={props.endDayMs}
          weekdays={props.weekdays}
          theme={props.theme}
          timeBoxStyle={timeBoxStyle}
          timeTextStyle={timeTextStyle}
          onInputChange={props.onEndInputChange}
          onDayChange={props.onEndDayChange}
          t={props.t}
        />
      )}
    </View>
  );
}

interface TimeFieldProps extends TranslatedSectionProps {
  label: string;
  input: string;
  dayMs: number;
  weekdays: readonly string[];
  theme: SectionTheme;
  timeBoxStyle: object[];
  timeTextStyle: object[];
  onInputChange: (value: string) => void;
  onDayChange: (value: number) => void;
}

function TimeField(props: TimeFieldProps) {
  return (
    <View style={[styles.field, styles.timeField]}>
      <ThemedText type="small" themeColor="textSecondary">
        {props.label}
      </ThemedText>
      <WheelField
        mode="time"
        value={timeInputAsDate(props.input)}
        displayText={props.input || '00:00'}
        onChange={(date) => props.onInputChange(fmtTime(date.getTime()))}
        style={props.timeBoxStyle}
        textStyle={props.timeTextStyle}
      />
      <DayStepper
        dayMs={props.dayMs}
        weekdays={props.weekdays}
        textColor={props.theme.text}
        backgroundColor={props.theme.backgroundElement}
        onChange={props.onDayChange}
        t={props.t}
      />
    </View>
  );
}
