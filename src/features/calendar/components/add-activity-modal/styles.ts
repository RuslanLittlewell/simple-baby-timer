import { StyleSheet } from 'react-native';

import { NunitoSans, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  card: { maxHeight: '88%' },
  content: { gap: Spacing.three },
  scroll: { flexShrink: 1 },
  field: { gap: Spacing.one, zIndex: 1 },
  timeRow: { flexDirection: 'row', gap: Spacing.two },
  timeField: { flex: 1 },
  timeInputBox: {
    minHeight: 46,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeInputText: { fontSize: 16, lineHeight: 22 },
  input: {
    minHeight: 46,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    fontFamily: NunitoSans.regular,
  },
  proBlock: { gap: Spacing.three },
  multiOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  multiOption: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  save: {
    minHeight: 48,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
