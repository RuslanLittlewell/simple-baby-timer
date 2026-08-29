import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

import { modalStyles } from '../../modal-styles';

interface EditorHeaderProps {
  title: string;
  deleteLabel: string;
  dangerColor: string;
  onDelete: () => void;
}

export function EditorHeader({ title, deleteLabel, dangerColor, onDelete }: EditorHeaderProps) {
  return (
    <View style={modalStyles.header}>
      <ThemedText style={modalStyles.title}>{title}</ThemedText>
      <Pressable
        accessibilityLabel={deleteLabel}
        onPress={onDelete}
        hitSlop={12}
        style={({ pressed }) => pressed && modalStyles.pressed}>
        <MaterialCommunityIcons name="trash-can-outline" size={24} color={dangerColor} />
      </Pressable>
    </View>
  );
}
