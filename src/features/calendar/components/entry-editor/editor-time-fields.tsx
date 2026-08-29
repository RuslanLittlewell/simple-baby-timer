import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { WheelField } from '@/components/wheel-field';

import { fmtTime } from '../../helpers';
import { DayStepper } from '../day-stepper';
import { timeInputAsDate } from './helpers';
import { styles } from './styles';
import { type EditorTheme, type TranslatedEditorProps } from './types';

interface EditorTimeFieldsProps extends TranslatedEditorProps {
  editingEvent: boolean;
  editingDay: boolean;
  startInput: string;
  endInput: string;
  startDayMs: number;
  endDayMs: number;
  weekdays: readonly string[];
  theme: EditorTheme;
  onStartInputChange: (value: string) => void;
  onEndInputChange: (value: string) => void;
  onStartDayChange: (value: number) => void;
  onEndDayChange: (value: number) => void;
}

export function EditorTimeFields(props: EditorTimeFieldsProps) {
  return (
    <View style={styles.timeFields}>
      <EditorTimeField
        label={props.t('editor.start')}
        input={props.startInput}
        dayMs={props.startDayMs}
        showDay={props.editingDay}
        weekdays={props.weekdays}
        theme={props.theme}
        onInputChange={props.onStartInputChange}
        onDayChange={props.onStartDayChange}
        t={props.t}
      />
      {!props.editingEvent && (
        <EditorTimeField
          label={props.t('editor.end')}
          input={props.endInput}
          dayMs={props.endDayMs}
          showDay={props.editingDay}
          weekdays={props.weekdays}
          theme={props.theme}
          onInputChange={props.onEndInputChange}
          onDayChange={props.onEndDayChange}
          t={props.t}
        />
      )}
    </View>
  );
}

interface EditorTimeFieldProps extends TranslatedEditorProps {
  label: string;
  input: string;
  dayMs: number;
  showDay: boolean;
  weekdays: readonly string[];
  theme: EditorTheme;
  onInputChange: (value: string) => void;
  onDayChange: (value: number) => void;
}

function EditorTimeField(props: EditorTimeFieldProps) {
  const inputStyle = [styles.timeInput, { backgroundColor: props.theme.backgroundElement }];
  const textStyle = [styles.timeInputText, { color: props.theme.text }];
  return (
    <View style={styles.timeField}>
      <ThemedText type="small" themeColor="textSecondary">
        {props.label}
      </ThemedText>
      <WheelField
        mode="time"
        value={timeInputAsDate(props.input)}
        displayText={props.input || '00:00'}
        onChange={(date) => props.onInputChange(fmtTime(date.getTime()))}
        style={inputStyle}
        textStyle={textStyle}
      />
      {props.showDay && (
        <DayStepper
          dayMs={props.dayMs}
          weekdays={props.weekdays}
          textColor={props.theme.text}
          backgroundColor={props.theme.backgroundElement}
          onChange={props.onDayChange}
          t={props.t}
        />
      )}
    </View>
  );
}
