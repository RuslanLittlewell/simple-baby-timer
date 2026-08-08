import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LANGUAGES, translate } from '@/i18n';

// All languages' translation of "Hello" — always the full set, independent
// of the app's current language, since this is what the animation cycles
// through before the user has picked one.
const GREETINGS = LANGUAGES.map((item) => translate(item.code, 'onboarding.greeting'));

const TYPE_MS = 95;
const ERASE_MS = 45;
const HOLD_MS = 1100;
const GAP_MS = 250;
const CURSOR_BLINK_MS = 500;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function useTypewriter(words: readonly string[]) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (words.length === 0) return;
    let cancelled = false;

    (async () => {
      let index = 0;
      while (!cancelled) {
        const word = words[index % words.length];
        for (let i = 1; i <= word.length; i++) {
          if (cancelled) return;
          setText(word.slice(0, i));
          await wait(TYPE_MS);
        }
        await wait(HOLD_MS);
        for (let i = word.length - 1; i >= 0; i--) {
          if (cancelled) return;
          setText(word.slice(0, i));
          await wait(ERASE_MS);
        }
        await wait(GAP_MS);
        index += 1;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [words]);

  return text;
}

function useBlink(intervalMs: number) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setVisible((value) => !value), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return visible;
}

export function HelloTypewriter() {
  const text = useTypewriter(GREETINGS);
  const cursorVisible = useBlink(CURSOR_BLINK_MS);

  return (
    <View style={styles.row}>
      <ThemedText style={styles.text} numberOfLines={1}>
        {text}
      </ThemedText>
      <ThemedText style={[styles.cursor, !cursorVisible && styles.cursorHidden]}>|</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  text: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
  },
  cursor: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
  },
  cursorHidden: {
    opacity: 0,
  },
});
