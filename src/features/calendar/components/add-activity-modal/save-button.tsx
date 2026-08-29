import { Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';

import { styles } from './styles';

interface SaveButtonProps {
  saving: boolean;
  label: string;
  foregroundColor: string;
  backgroundColor: string;
  onPress: () => void;
}

export function SaveButton({
  saving,
  label,
  foregroundColor,
  backgroundColor,
  onPress,
}: SaveButtonProps) {
  return (
    <Pressable
      disabled={saving}
      onPress={onPress}
      style={[styles.save, { backgroundColor: foregroundColor }]}>
      <ThemedText type="smallBold" style={{ color: backgroundColor }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}
