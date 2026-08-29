import { SelectField } from './select-field';
import { type ManualKind, type TranslatedSectionProps } from './types';

export const MANUAL_KINDS: ManualKind[] = ['settling', 'sleep', 'awake', 'feeding', 'diaper', 'poop'];

interface ActivityFieldProps extends TranslatedSectionProps {
  kind: ManualKind;
  onChange: (kind: ManualKind) => void;
}

export function ActivityField({ kind, onChange, t }: ActivityFieldProps) {
  const options = MANUAL_KINDS.map((item) => ({
    value: item,
    label: item === 'poop' ? '💩' : t(`kind.${item}`),
  }));

  return (
    <SelectField
      label={t('manual.activity')}
      value={kind}
      options={options}
      onSelect={(value) => onChange(value as ManualKind)}
    />
  );
}
