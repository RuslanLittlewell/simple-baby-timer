import { BlurView } from 'expo-blur';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { WheelSheetHost } from '@/components/wheel-sheet';
import { useActivityColors } from '@/hooks/use-activity-colors';
import { useTheme } from '@/hooks/use-theme';
import { WEEKDAYS_I18N } from '@/i18n';
import { useAppStore, useT } from '@/state/app-state';

import { KIND_META } from '../../constants';
import { modalStyles } from '../../modal-styles';
import { EditableProSection } from './editable-pro-section';
import { EditorHeader } from './editor-header';
import { EditorTimeFields } from './editor-time-fields';
import { MilkField } from './milk-field';
import { ReadonlyProSection } from './readonly-pro-section';
import { SaveButton } from './save-button';
import { styles } from './styles';
import { type EntryEditorProps } from './types';
import { useEntryEditorForm } from './use-entry-editor-form';

export function EntryEditor(props: EntryEditorProps) {
  const theme = useTheme();
  const { accent } = useActivityColors();
  const t = useT();
  const language = useAppStore((state) => state.language);
  const weekdays = WEEKDAYS_I18N[language];
  const editor = useEntryEditorForm(props, t);
  const entry = props.entry;
  const title = entry ? t(`kind.${entry.kind}`) : t('activity.title');
  const borderColor = entry ? accent[KIND_META[entry.kind].gradKey] : theme.border;
  const showMilk = entry?.kind === 'feeding';

  return (
    <Modal visible={!!entry} transparent animationType="fade" onRequestClose={props.onClose}>
      <WheelSheetHost>
        <KeyboardAvoidingView
          style={modalStyles.backdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <BlurView
            experimentalBlurMethod="dimezisBlurView"
            intensity={45}
            tint="dark"
            pointerEvents="none"
            style={modalStyles.blur}
          />
          <Pressable style={StyleSheet.absoluteFill} onPress={props.onClose} />
          <View style={[modalStyles.card, { backgroundColor: theme.background, borderColor }]}>
            <EditorHeader
              title={title}
              deleteLabel={t('editor.delete')}
              dangerColor={theme.danger}
              onDelete={editor.confirmDelete}
            />

            {editor.editableProKind &&
              (props.proActive ? (
                <EditableProSection
                  kind={editor.editableProKind}
                  methods={editor.values.settlingMethods}
                  sleepPlace={editor.values.sleepPlace}
                  feedingMode={editor.values.feedingMode}
                  breastSide={editor.values.breastSide}
                  bottleContent={editor.values.bottleContent}
                  theme={theme}
                  onMethodToggle={editor.toggleSettlingMethod}
                  onSleepPlaceChange={(value) => editor.setField('sleepPlace', value)}
                  onFeedingModeChange={(value) => editor.setField('feedingMode', value)}
                  onBreastSideChange={(value) => editor.setField('breastSide', value)}
                  onBottleContentChange={(value) => editor.setField('bottleContent', value)}
                  t={t}
                />
              ) : (
                <ReadonlyProSection details={entry?.proDetails} theme={theme} t={t} />
              ))}

            <EditorTimeFields
              editingEvent={editor.editingEvent}
              editingDay={editor.editingDay}
              startInput={editor.values.startInput}
              endInput={editor.values.endInput}
              startDayMs={editor.values.startDayMs}
              endDayMs={editor.values.endDayMs}
              weekdays={weekdays}
              theme={theme}
              onStartInputChange={(value) => editor.setValidatedField('startInput', value)}
              onEndInputChange={(value) => editor.setValidatedField('endInput', value)}
              onStartDayChange={(value) => editor.setValidatedField('startDayMs', value)}
              onEndDayChange={(value) => editor.setValidatedField('endDayMs', value)}
              t={t}
            />

            {showMilk && (
              <MilkField
                value={editor.values.milkInput}
                theme={theme}
                onChange={(value) => editor.setValidatedField('milkInput', value)}
                t={t}
              />
            )}
            {!!editor.error && (
              <ThemedText themeColor="danger" style={styles.errorText}>
                {editor.error}
              </ThemedText>
            )}
            <SaveButton
              label={t('editor.save')}
              foregroundColor={theme.text}
              backgroundColor={theme.background}
              onPress={() => void editor.saveEntry()}
            />
          </View>
        </KeyboardAvoidingView>
      </WheelSheetHost>
    </Modal>
  );
}
