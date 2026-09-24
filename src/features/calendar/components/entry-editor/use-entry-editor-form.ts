import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import {
  deleteSession,
  eventDurationMs,
  resolveOverlappingSessions,
  updateSession,
  type EventKind,
  type ProDetails,
} from '@/lib/activity-store';
import { enqueueSessionDelete, enqueueSessionUpsert } from '@/lib/sync';
import { useAppStore } from '@/state/app-state';
import { usePersonalRegimeStore } from '@/state/personal-regime-state';

import { normalizeEventTitle } from '../../helpers';
import { type SettlingMethod } from '../../pro-details';
import {
  buildEditableProDetails,
  buildEditedRange,
  editorKindFlags,
  initialEditorValues,
  normalizeMilk,
  normalizeNotes,
} from './helpers';
import { type EntryEditorProps, type EntryEditorValues, type TranslatedEditorProps } from './types';

const EMPTY_VALUES: EntryEditorValues = {
  startInput: '',
  endInput: '',
  startDayMs: 0,
  endDayMs: 0,
  milkInput: '',
  notesInput: '',
  titleInput: '',
  settlingMethods: [],
  sleepPlace: 'crib',
  feedingMode: 'breast',
  breastSide: 'left',
  bottleContent: 'formula',
};

export function useEntryEditorForm(
  props: EntryEditorProps,
  t: TranslatedEditorProps['t'],
) {
  const children = useAppStore((state) => state.children);
  const [values, setValues] = useState<EntryEditorValues>(EMPTY_VALUES);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!props.entry) return;
    setValues(initialEditorValues(props.entry) as EntryEditorValues);
    setError('');
  }, [props.entry]);

  const flags = editorKindFlags(props.entry?.kind);
  const remoteIdOf = (childId?: string) =>
    childId ? children.find((child) => child.id === childId)?.remoteId : undefined;

  const setField = <Key extends keyof EntryEditorValues>(
    key: Key,
    value: EntryEditorValues[Key],
  ) => setValues((current) => ({ ...current, [key]: value }));

  const setValidatedField = <
    Key extends 'startInput' | 'endInput' | 'startDayMs' | 'endDayMs' | 'milkInput' | 'titleInput',
  >(
    key: Key,
    value: EntryEditorValues[Key],
  ) => {
    setField(key, value);
    setError('');
  };

  const toggleSettlingMethod = (method: SettlingMethod) => {
    const selected = values.settlingMethods.includes(method);
    const methods = selected
      ? values.settlingMethods.filter((item) => item !== method)
      : [...values.settlingMethods, method];
    setField('settlingMethods', methods);
  };

  const saveEntry = async () => {
    const entry = props.entry;
    if (!entry) return;
    const duration = flags.editingEvent ? eventDurationMs(entry.kind as EventKind) : 0;
    const rangeResult = buildEditedRange({
      kind: entry.kind,
      originalStart: entry.start,
      startInput: values.startInput,
      endInput: values.endInput,
      startDayMs: values.startDayMs,
      endDayMs: values.endDayMs,
      eventDurationMs: duration,
    });
    if (!rangeResult.range) {
      const errorKey =
        rangeResult.error === 'format' ? 'editor.errTimeFormat' : 'editor.errEndAfterStart';
      setError(t(errorKey));
      return;
    }

    const title = entry.kind === 'custom' ? normalizeEventTitle(values.titleInput) : entry.title;
    if (entry.kind === 'custom' && !title) {
      setError(t('editor.errTitleRequired'));
      return;
    }

    const milk = normalizeMilk(entry.kind, values.milkInput);
    if (milk.error) {
      setError(t('editor.errMilkRange'));
      return;
    }
    const proDetails = props.proActive
      ? (buildEditableProDetails(entry.kind, values) as ProDetails | undefined)
      : entry.proDetails;
    const notes = entry.kind === 'awake'
      ? normalizeNotes(entry.kind, values.notesInput)
      : entry.notes;
    const update = { ...rangeResult.range, milkMl: milk.milkMl, proDetails, notes, title };
    const originalDate = new Date(entry.start);

    const resolution = await resolveOverlappingSessions(
      entry.kind,
      update.start,
      update.end,
      entry.childId,
      entry.id,
    );
    for (const session of [...resolution.updated, ...resolution.created]) {
      const remoteId = remoteIdOf(session.childId);
      if (remoteId) enqueueSessionUpsert(remoteId, session);
    }
    for (const session of resolution.deleted) {
      const remoteId = remoteIdOf(session.childId);
      if (remoteId) enqueueSessionDelete(remoteId, session);
    }

    await updateSession(entry.id, originalDate, update);
    if (entry.kind === 'sleep' && entry.childId) {
      usePersonalRegimeStore
        .getState()
        .recordCompletedSleep(entry.childId, update.start, update.end);
    }
    const remoteId = remoteIdOf(entry.childId);
    if (remoteId) enqueueSessionUpsert(remoteId, { ...entry, ...update });
    await props.onChanged();
    props.onClose();
  };

  const confirmDelete = () => {
    const entry = props.entry;
    if (!entry) return;
    Alert.alert(t('editor.deleteConfirm'), undefined, [
      { text: t('editor.cancel'), style: 'cancel' },
      {
        text: t('editor.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteSession(entry.id, new Date(entry.start));
          const remoteId = remoteIdOf(entry.childId);
          if (remoteId) enqueueSessionDelete(remoteId, entry);
          await props.onChanged();
          props.onClose();
        },
      },
    ]);
  };

  return {
    values,
    error,
    ...flags,
    setField,
    setValidatedField,
    toggleSettlingMethod,
    saveEntry,
    confirmDelete,
  };
}
