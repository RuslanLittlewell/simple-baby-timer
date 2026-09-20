import { useEffect, useRef } from 'react';
import { Pressable, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useWheelSheet } from '@/components/wheel-sheet';

interface WheelFieldProps {
  accessibilityLabel?: string;
  value: Date;
  mode: 'time' | 'date';
  displayText: string;
  onChange: (date: Date) => void;
  
  
  onDismiss?: () => void;
  minimumDate?: Date;
  maximumDate?: Date;
  
  
  openOnMount?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}





export function WheelField({
  accessibilityLabel,
  value,
  mode,
  displayText,
  onChange,
  onDismiss,
  minimumDate,
  maximumDate,
  openOnMount = false,
  style,
  textStyle,
}: WheelFieldProps) {
  const openSheet = useWheelSheet();
  const latest = useRef({ value, mode, minimumDate, maximumDate, onChange, onDismiss });
  latest.current = { value, mode, minimumDate, maximumDate, onChange, onDismiss };

  const open = () => {
    const { value: at, mode: kind, minimumDate: min, maximumDate: max } = latest.current;
    openSheet?.({
      value: at,
      mode: kind,
      minimumDate: min,
      maximumDate: max,
      onConfirm: (date) => latest.current.onChange(date),
      onDismiss: () => latest.current.onDismiss?.(),
    });
  };

  useEffect(() => {
    if (openOnMount) open();
    
    
    
  }, []);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={open}
      style={style}>
      <ThemedText type="smallBold" style={textStyle}>
        {displayText}
      </ThemedText>
    </Pressable>
  );
}
