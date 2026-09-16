import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { WheelField } from '@/components/wheel-field';
import { WheelSheetHost } from '@/components/wheel-sheet';
import { useTheme } from '@/hooks/use-theme';
import { type Child, type ChildGradientKey } from '@/lib/children';
import { parseMeasurementNumber } from '@/lib/growth-measurements';
import { useT } from '@/state/app-state';

import { CHILD_GRADIENT_FG, CHILD_GRADIENTS } from '../../constants';
import { BabySvg } from '../baby-svg';
import { GradientPicker } from '../gradient-picker';
import { BIRTHDAY_MIN_DATE, formatBirthday, parseBirthday } from './helpers';
import { styles } from './styles';

interface AddChildModalProps {
  visible: boolean;
  child?: Child | null;
  onClose: () => void;
  onSave: (
    name: string,
    gradientKey: ChildGradientKey,
    birthday: number,
    growth?: { heightCm: number; weightKg: number },
  ) => void;
}

export function AddChildModal({ visible, child, onClose, onSave }: AddChildModalProps) {
  const theme = useTheme();
  const t = useT();

  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gradientKey, setGradientKey] = useState<ChildGradientKey>('sky');

  useEffect(() => {
    if (!visible) return;
    setName(child?.name ?? '');
    setBirthday(child?.birthday === undefined ? '' : formatBirthday(new Date(child.birthday)));
    setHeight('');
    setWeight('');
    setGradientKey(child?.gradientKey ?? 'sky');
  }, [visible, child]);

  const birthdayMs = parseBirthday(birthday);
  const heightCm = parseMeasurementNumber(height);
  const weightKg = parseMeasurementNumber(weight);
  const canSave =
    name.trim().length > 0 &&
    birthdayMs !== null &&
    (!!child || (heightCm !== null && weightKg !== null));
  const fg = CHILD_GRADIENT_FG[gradientKey];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <WheelSheetHost>
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
        <Pressable style={styles.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <ThemedText style={styles.title}>
            {t(child ? 'children.edit' : 'children.add')}
          </ThemedText>

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
            {t('children.birthday')}
          </ThemedText>
          <WheelField
            mode="date"
            value={birthdayMs !== null ? new Date(birthdayMs) : new Date()}
            displayText={birthday || t('children.birthdayPlaceholder')}
            onChange={(date) => setBirthday(formatBirthday(date))}
            minimumDate={BIRTHDAY_MIN_DATE}
            maximumDate={new Date()}
            style={[styles.dateInput, { backgroundColor: theme.backgroundElement }]}
            textStyle={[
              styles.dateInputText,
              { color: birthday ? theme.text : theme.textSecondary },
            ]}
          />

          {!child && (
            <View style={styles.measurementInputs}>
              <View style={styles.measurementField}>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('growth.weight')}
                </ThemedText>
                <TextInput
                  accessibilityLabel={t('growth.weight')}
                  value={weight}
                  onChangeText={setWeight}
                  inputMode="decimal"
                  keyboardType="decimal-pad"
                  placeholder={t('growth.weightPlaceholder')}
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.measurementInput,
                    { color: theme.text, backgroundColor: theme.backgroundElement },
                  ]}
                />
              </View>
              <View style={styles.measurementField}>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('growth.height')}
                </ThemedText>
                <TextInput
                  accessibilityLabel={t('growth.height')}
                  value={height}
                  onChangeText={setHeight}
                  inputMode="decimal"
                  keyboardType="decimal-pad"
                  placeholder={t('growth.heightPlaceholder')}
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.measurementInput,
                    { color: theme.text, backgroundColor: theme.backgroundElement },
                  ]}
                />
              </View>
            </View>
          )}

          <ThemedText type="small" themeColor="textSecondary">
            {t('children.color')}
          </ThemedText>
          <GradientPicker selected={gradientKey} onSelect={setGradientKey} />

          <Pressable
            disabled={!canSave}
            onPress={() => {
              if (birthdayMs === null) return;
              if (child) onSave(name, gradientKey, birthdayMs);
              else if (heightCm !== null && weightKg !== null) {
                onSave(name, gradientKey, birthdayMs, { heightCm, weightKg });
              }
            }}
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
      </WheelSheetHost>
    </Modal>
  );
}
