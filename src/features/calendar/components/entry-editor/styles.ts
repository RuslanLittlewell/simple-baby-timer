import { StyleSheet } from 'react-native';

import { NunitoSans, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  proSection: { gap: Spacing.one },
  proDetails: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  proDetailsColumn: { flex: 1, gap: Spacing.one },
  field: { gap: Spacing.one, zIndex: 1 },
  multiOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  multiOption: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  timeFields: { flexDirection: 'row', gap: Spacing.three },
  timeField: { flex: 1, gap: Spacing.one },
  timeInput: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  timeInputText: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  milkInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    paddingVertical: Spacing.three,
    fontFamily: NunitoSans.bold,
  },
  saveButton: {
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
  },
  saveButtonText: { fontSize: 16, fontWeight: '700' },
  errorText: { fontSize: 13, lineHeight: 18 },
});
