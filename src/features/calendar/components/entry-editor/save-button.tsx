import { Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';

import { modalStyles } from '../../modal-styles';
import { styles } from './styles';

interface SaveButtonProps {
  label: string;
  foregroundColor: string;
  backgroundColor: string;
  onPress: () => void;
}

export function SaveButton(props: SaveButtonProps) {
  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.saveButton,
        { backgroundColor: props.foregroundColor },
        pressed && modalStyles.pressed,
      ]}>
      <ThemedText style={[styles.saveButtonText, { color: props.backgroundColor }]}>
        {props.label}
      </ThemedText>
    </Pressable>
  );
}
