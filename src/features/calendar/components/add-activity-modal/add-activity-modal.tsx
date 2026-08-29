import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { WheelSheetHost } from '@/components/wheel-sheet';
import { useActivityColors } from '@/hooks/use-activity-colors';
import { useTheme } from '@/hooks/use-theme';
import { WEEKDAYS_I18N } from '@/i18n';
import { useAppStore, useT } from '@/state/app-state';

import { KIND_META } from '../../constants';
import { modalStyles } from '../../modal-styles';
import { ActivityField } from './activity-field';
import { ProParameters } from './pro-parameters';
import { SaveButton } from './save-button';
import { styles } from './styles';
import { TimeFields } from './time-fields';
import { type AddActivityModalProps } from './types';
import { useAddActivityForm } from './use-add-activity-form';

export function AddActivityModal(props: AddActivityModalProps) {
  const theme = useTheme();
  const { accent } = useActivityColors();
  const t = useT();
  const language = useAppStore((state) => state.language);
  const weekdays = WEEKDAYS_I18N[language];
  const formState = useAddActivityForm(props, t);
  const { form, eventKind } = formState;
  const borderColor = accent[KIND_META[form.kind].gradKey];
  const showProParameters = props.proActive && form.kind !== 'awake' && !eventKind;
  const showProRequired = !props.proActive && !eventKind;

  return (
    <Modal visible={props.visible} transparent animationType="fade" onRequestClose={props.onClose}>
      <WheelSheetHost>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={modalStyles.backdrop}>
          <BlurView intensity={35} tint="dark" pointerEvents="none" style={modalStyles.blur} />
          <Pressable style={StyleSheet.absoluteFill} onPress={props.onClose} />
          <View
            style={[
              modalStyles.card,
              styles.card,
              { backgroundColor: theme.background, borderColor },
            ]}>
            <View style={modalStyles.header}>
              <ThemedText style={modalStyles.title}>{t('manual.title')}</ThemedText>
              <Pressable onPress={props.onClose} hitSlop={12}>
                <MaterialCommunityIcons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}>
              <ActivityField
                kind={form.kind}
                onChange={(kind) => formState.setField('kind', kind)}
                t={t}
              />
              <TimeFields
                eventKind={eventKind}
                startInput={form.startInput}
                endInput={form.endInput}
                startDayMs={form.startDayMs}
                endDayMs={form.endDayMs}
                weekdays={weekdays}
                theme={theme}
                onStartInputChange={(value) => formState.setTimeField('startInput', value)}
                onEndInputChange={(value) => formState.setTimeField('endInput', value)}
                onStartDayChange={(value) => formState.setTimeField('startDayMs', value)}
                onEndDayChange={(value) => formState.setTimeField('endDayMs', value)}
                t={t}
              />

              {showProParameters && (
                <ProParameters
                  kind={form.kind}
                  sleepPlace={form.sleepPlace}
                  feedingMode={form.feedingMode}
                  breastSide={form.breastSide}
                  bottleContent={form.bottleContent}
                  volume={form.volume}
                  settlingMethods={form.settlingMethods}
                  theme={theme}
                  onSleepPlaceChange={(value) => formState.setField('sleepPlace', value)}
                  onFeedingModeChange={(value) => formState.setField('feedingMode', value)}
                  onBreastSideChange={(value) => formState.setField('breastSide', value)}
                  onBottleContentChange={(value) => formState.setField('bottleContent', value)}
                  onVolumeChange={(value) => formState.setField('volume', value)}
                  onSettlingMethodToggle={formState.toggleSettlingMethod}
                  t={t}
                />
              )}
              {showProRequired && (
                <ThemedText type="small" themeColor="textSecondary">
                  {t('manual.proRequired')}
                </ThemedText>
              )}
              {formState.error ? (
                <ThemedText themeColor="danger">{formState.error}</ThemedText>
              ) : null}
            </ScrollView>

            <SaveButton
              saving={formState.saving}
              label={t('editor.save')}
              foregroundColor={theme.text}
              backgroundColor={theme.background}
              onPress={() => void formState.submit()}
            />
          </View>
        </KeyboardAvoidingView>
      </WheelSheetHost>
    </Modal>
  );
}
