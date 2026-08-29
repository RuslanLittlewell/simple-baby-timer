import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import {
  deleteSession,
  eventDurationMs,
  updateSession,
  type EventKind,
  type ProDetails,
} from '@/lib/activity-store';
import { enqueueSessionDelete, enqueueSessionUpsert } from '@/lib/sync';
import { useAppStore } from '@/state/app-state';

import { type SettlingMethod } from '../../pro-details';
import {
  buildEditableProDetails,
  buildEditedRange,
  editorKindFlags,
  initialEditorValues,
  normalizeMilk,
} from './helpers';
import { type EntryEditorProps, type EntryEditorValues, type TranslatedEditorProps } from './types';

const EMPTY_VALUES: EntryEditorValues = {
  startInput: '',
  endInput: '',
  startDayMs: 0,
  endDayMs: 0,
  milkInput: '',
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
    Key extends 'startInput' | 'endInput' | 'startDayMs' | 'endDayMs' | 'milkInput',
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

    const milk = normalizeMilk(entry.kind, values.milkInput);
    if (milk.error) {
      setError(t('editor.errMilkRange'));
      return;
    }
    const proDetails = props.proActive
      ? (buildEditableProDetails(entry.kind, values) as ProDetails | undefined)
      : entry.proDetails;
    const update = { ...rangeResult.range, milkMl: milk.milkMl, proDetails };
    const originalDate = new Date(entry.start);

    await updateSession(entry.id, originalDate, update);
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
