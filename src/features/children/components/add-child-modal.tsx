import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { type ChildGradientKey } from '@/lib/children';
import { useT } from '@/state/app-state';

import { CHILD_GRADIENT_FG, CHILD_GRADIENTS } from '../constants';
import { BabySvg } from './baby-svg';
import { GradientPicker } from './gradient-picker';

interface AddChildModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, gradientKey: ChildGradientKey) => void;
}

export function AddChildModal({ visible, onClose, onSave }: AddChildModalProps) {
  const theme = useTheme();
  const t = useT();

  const [name, setName] = useState('');
  const [gradientKey, setGradientKey] = useState<ChildGradientKey>('sky');

  useEffect(() => {
    if (!visible) return;
    setName('');
    setGradientKey('sky');
  }, [visible]);

  const canSave = name.trim().length > 0;
  const fg = CHILD_GRADIENT_FG[gradientKey];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <BlurView
          experimentalBlurMethod="dimezisBlurView"
          intensity={45}
          tint="dark"
          pointerEvents="none"
          style={styles.blur}
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <ThemedText style={styles.title}>{t('children.add')}</ThemedText>

          <View style={styles.preview}>
            <LinearGradient
              colors={CHILD_GRADIENTS[gradientKey]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.previewCircle}>
              <BabySvg size={64} faceColor={fg} featureColor={CHILD_GRADIENTS[gradientKey][1]} />
            </LinearGradient>
          </View>

          <TextInput
            value={name}
            onChangeText={setName}
            maxLength={24}
            placeholder={t('children.namePlaceholder')}
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.nameInput,
              { color: theme.text, backgroundColor: theme.backgroundElement },
            ]}
          />

          <ThemedText type="small" themeColor="textSecondary">
            {t('children.color')}
          </ThemedText>
          <GradientPicker selected={gradientKey} onSelect={setGradientKey} />

          <Pressable
            disabled={!canSave}
            onPress={() => onSave(name, gradientKey)}
            style={({ pressed }) => [
              styles.saveButton,
              { backgroundColor: theme.text },
              !canSave && styles.saveDisabled,
              pressed && styles.pressed,
            ]}>
            <ThemedText style={[styles.saveText, { color: theme.background }]}>
              {t('children.save')}
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  blur: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Spacing.four,
    borderWidth: 1,
    borderColor: '#3A3D43',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
  },
  preview: {
    alignItems: 'center',
  },
  previewCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameInput: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  saveButton: {
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
  },
  saveDisabled: {
    opacity: 0.35,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
