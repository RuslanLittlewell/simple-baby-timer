import { useEffect, useState } from 'react';

import { eventDurationMs, type EventKind, type ProDetails } from '@/lib/activity-store';

import { isEvent, type Translate } from '../../helpers';
import { type SettlingMethod } from '../../pro-details';
import {
  buildProDetails,
  buildTimeRange,
  initialTimeInputs,
  parsePositiveVolume,
  startOfLocalDay,
} from './helpers';
import { type AddActivityFormValues, type AddActivityModalProps } from './types';

const EMPTY_FORM: AddActivityFormValues = {
  kind: 'settling',
  startInput: '09:00',
  endInput: '09:30',
  startDayMs: 0,
  endDayMs: 0,
  sleepPlace: 'crib',
  feedingMode: 'breast',
  breastSide: 'left',
  bottleContent: 'formula',
  volume: '',
  settlingMethods: [],
};

export function useAddActivityForm(
  props: Pick<AddActivityModalProps, 'visible' | 'day' | 'proActive' | 'onClose' | 'onSave'>,
  t: Translate,
) {
  const [form, setForm] = useState<AddActivityFormValues>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!props.visible) return;
    const inputs = initialTimeInputs(props.day);
    const dayMs = startOfLocalDay(props.day.getTime());
    setForm({ ...EMPTY_FORM, ...inputs, startDayMs: dayMs, endDayMs: dayMs });
    setError('');
    setSaving(false);
  }, [props.day, props.visible]);

  const eventKind = isEvent(form.kind);
  const parsedVolume = parsePositiveVolume(form.volume);
  const bottleVolume =
    form.kind === 'feeding' && form.feedingMode === 'bottle' ? parsedVolume : undefined;

  const setField = <Key extends keyof AddActivityFormValues>(
    key: Key,
    value: AddActivityFormValues[Key],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const setTimeField = <Key extends 'startInput' | 'endInput' | 'startDayMs' | 'endDayMs'>(
    key: Key,
    value: AddActivityFormValues[Key],
  ) => {
    setField(key, value);
    setError('');
  };

  const toggleSettlingMethod = (method: SettlingMethod) => {
    const selected = form.settlingMethods.includes(method);
    const settlingMethods = selected
      ? form.settlingMethods.filter((item) => item !== method)
      : [...form.settlingMethods, method];
    setField('settlingMethods', settlingMethods);
  };

  const submit = async () => {
    const duration = eventKind ? eventDurationMs(form.kind as EventKind) : 0;
    const result = buildTimeRange({
      startInput: form.startInput,
      endInput: form.endInput,
      startDayMs: form.startDayMs,
      endDayMs: form.endDayMs,
      eventKind,
      eventDurationMs: duration,
    });
    if (!result.range) {
      setError(t(result.error === 'format' ? 'editor.errTimeFormat' : 'editor.errEndAfterStart'));
      return;
    }

    const details = buildProDetails({
      proActive: props.proActive,
      kind: form.kind,
      eventKind,
      settlingMethods: form.settlingMethods,
      sleepPlace: form.sleepPlace,
      feedingMode: form.feedingMode,
      breastSide: form.breastSide,
      bottleContent: form.bottleContent,
      bottleVolume,
    }) as ProDetails | undefined;

    setSaving(true);
    try {
      await props.onSave(form.kind, result.range.start, result.range.end, details, bottleVolume);
      props.onClose();
    } finally {
      setSaving(false);
    }
  };

  return {
    form,
    error,
    saving,
    eventKind,
    setField,
    setTimeField,
    toggleSettlingMethod,
    submit,
  };
}
