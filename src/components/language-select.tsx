import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LANGUAGES } from '@/i18n';
import { useAppState } from '@/state/app-state';

const MENU_WIDTH = 60;

export function LanguageSelect() {
  const theme = useTheme();
  const { language, setLanguage } = useAppState();
  const triggerRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  const openMenu = () => {
    triggerRef.current?.measureInWindow((x, y, w, h) => {
      setAnchor({ x, y, w, h });
      setOpen(true);
    });
  };

  const screenWidth = Dimensions.get('window').width;

  const menuLeft = Math.max(8, Math.min(anchor.x + anchor.w - MENU_WIDTH, screenWidth - MENU_WIDTH - 8));

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={openMenu}
        style={({ pressed }) => [
          styles.trigger,
          { backgroundColor: theme.backgroundElement },
          pressed && styles.pressed,
        ]}>
        <ThemedText style={styles.flag}>{current.flag}</ThemedText>
        <MaterialCommunityIcons name="chevron-down" size={16} color={theme.text} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View
            style={[
              styles.menu,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.backgroundSelected,
                top: anchor.y + anchor.h + 4,
                left: menuLeft,
              },
            ]}>
            {LANGUAGES.map((lang) => {
              const active = lang.code === language;
              return (
                <Pressable
                  key={lang.code}
                  accessibilityLabel={lang.label}
                  onPress={() => {
                    setLanguage(lang.code);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.item,
                    active && { backgroundColor: theme.backgroundSelected },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText style={styles.flag}>{lang.flag}</ThemedText>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    paddingLeft: Spacing.two,
    paddingRight: Spacing.one,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
  },
  flag: {
    fontSize: 22,
    lineHeight: 28,
  },
  pressed: {
    opacity: 0.6,
  },
  backdrop: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    width: MENU_WIDTH,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.one,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    marginHorizontal: Spacing.one,
    marginVertical: 1,
    borderRadius: Spacing.two,
    alignSelf: 'stretch',
  },
});
