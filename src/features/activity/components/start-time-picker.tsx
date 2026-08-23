import { useRef } from 'react';
import { StyleSheet } from 'react-native';

import { WheelField } from '@/components/wheel-field';

interface StartTimePickerProps {
  
  
  runningStartedAt?: number;
  onConfirm: (startedAt: number) => void;
  onDismiss: () => void;
}



export function StartTimePicker({
  runningStartedAt,
  onConfirm,
  onDismiss,
}: StartTimePickerProps) {
  
  
  const opened = useRef(new Date()).current;
  const dayStart = new Date(
    opened.getFullYear(),
    opened.getMonth(),
    opened.getDate(),
  ).getTime();
  
  
  const minimum =
    runningStartedAt !== undefined && runningStartedAt > dayStart
      ? new Date(runningStartedAt)
      : new Date(dayStart);

  return (
    <WheelField
      mode="time"
      value={opened}
      displayText=""
      openOnMount
      minimumDate={minimum}
      maximumDate={opened}
      
      onChange={(picked) =>
        onConfirm(
          picked.getTime() === opened.getTime() ? Date.now() : picked.getTime(),
        )
      }
      onDismiss={onDismiss}
      style={styles.hidden}
    />
  );
}

const styles = StyleSheet.create({
  hidden: {
    width: 0,
    height: 0,
    opacity: 0,
  },
});
