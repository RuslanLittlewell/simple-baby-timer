import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

import { STRIPE_THICKNESS, TIMELINE_Z_INDEX } from '../../constants';

export const styles = StyleSheet.create({
  block: {
    position: 'absolute',
    right: Spacing.two,
    borderRadius: 8,
    overflow: 'hidden',
  },
  blockGradient: {
    flex: 1,
  },
  liveBlock: {
    borderWidth: 2,
    zIndex: TIMELINE_Z_INDEX.live,
  },
  completedBlock: {
    zIndex: TIMELINE_Z_INDEX.completed,
  },
  feedingBlock: {
    zIndex: TIMELINE_Z_INDEX.event + 1,
  },
  eventBlock: {
    position: 'absolute',
    right: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: Spacing.two,
    zIndex: TIMELINE_Z_INDEX.event,
  },
  poopEventBlock: {
    justifyContent: 'flex-start',
    paddingLeft: Spacing.two,
    paddingRight: 0,
  },
  nightWakingEventBlock: {
    justifyContent: 'flex-start',
    paddingLeft: Spacing.two,
    paddingRight: 0,
  },
  eventStripes: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 6,
    overflow: 'hidden',
  },
  eventStripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: STRIPE_THICKNESS,
  },
  blockContent: {
    paddingHorizontal: Spacing.two,
    paddingTop: 2,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
  },
  blockTitle: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  breastSideMarker: {
    fontSize: 14,
    lineHeight: 14,
    fontWeight: '700',
    flexShrink: 0,
  },
  blockTime: {
    fontSize: 11,
    marginTop: 1,
    opacity: 0.85,
  },
  pressed: {
    opacity: 0.5,
  },
});
