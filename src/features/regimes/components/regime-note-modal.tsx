import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/state/app-state';

import { useKindStyle } from '../constants';
import { formatMin } from '../helpers';
import { type RegimeStep } from '../types';
import { getRegimeNoteModalMaxHeight } from './regime-note-modal.helpers';

interface RegimeNoteModalProps {
  step: RegimeStep | null;
  onClose: () => void;
}

export function RegimeNoteModal({ step, onClose }: RegimeNoteModalProps) {
  const theme = useTheme();
  const t = useT();
  const kindStyle = useKindStyle();
  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
  const style = step ? kindStyle[step.kind] : null;
  const maxCardHeight = getRegimeNoteModalMaxHeight({
    windowHeight,
    topInset,
    bottomInset,
    verticalOuterSpacing: Spacing.four,
  });

  const timeLabel = step
    ? step.startMin === null
      ? step.time
      : step.endMin === null
        ? formatMin(step.startMin)
        : `${formatMin(step.startMin)}–${formatMin(step.endMin)}`
    : '';

  return (
    <Modal visible={!!step} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <BlurView
          experimentalBlurMethod="dimezisBlurView"
          intensity={45}
          tint="dark"
          pointerEvents="none"
          style={styles.blur}
        />
        {/* Drawn above the blur, so a backdrop tap can never be swallowed by it. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.card,
            { backgroundColor: theme.background, maxHeight: maxCardHeight },
          ]}>
          {step && style && (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.cardContent}
              showsVerticalScrollIndicator>
              <View style={styles.header}>
                <View style={[styles.iconWrap, { backgroundColor: style.colors[0] }]}>
                  <MaterialCommunityIcons name={style.icon} size={22} color={style.fg} />
                </View>
                <View style={styles.headerText}>
                  <ThemedText style={styles.title}>{step.action}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {timeLabel}
                  </ThemedText>
                </View>
              </View>

              <ThemedText style={styles.note}>
                {step.note || t('regimes.noNote')}
              </ThemedText>
              {!!step.developmentalGamesGuidance && (
                <ThemedText style={styles.gamesGuidance} themeColor="textSecondary">
                  {step.developmentalGamesGuidance}
                </ThemedText>
              )}
              {!!step.games?.length && (
                <View style={styles.games}>
                  {step.games.map((game, index) => (
                    <View
                      key={game.id}
                      accessible
                      accessibilityLabel={`${game.title}. ${game.instruction}`}
                      style={styles.game}>
                      <ThemedText style={styles.gameTitle}>
                        {index + 1}. {game.title}
                      </ThemedText>
                      <ThemedText style={styles.gameInstruction} themeColor="textSecondary">
                        {game.instruction}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  blur: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Spacing.four,
    borderWidth: 1,
    borderColor: '#3A3D43',
    padding: Spacing.four,
  },
  scrollView: {
    flexShrink: 1,
    // A flex item will not shrink past its own content without this, so
    // flexShrink alone leaves the card clipping instead of scrolling.
    minHeight: 0,
  },
  cardContent: {
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
  },
  note: {
    fontSize: 15,
    lineHeight: 22,
  },
  games: {
    gap: Spacing.three,
  },
  game: {
    gap: Spacing.one,
  },
  gameTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  gameInstruction: {
    fontSize: 14,
    lineHeight: 20,
  },
  gamesGuidance: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
