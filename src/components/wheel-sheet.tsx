import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Animated,
  AppState,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore, useT } from '@/state/app-state';

export interface WheelSheetRequest {
  value: Date;
  mode: 'time' | 'date';
  minimumDate?: Date;
  maximumDate?: Date;
  onConfirm: (date: Date) => void;
  onDismiss?: () => void;
}

const WheelSheetContext = createContext<((request: WheelSheetRequest) => void) | null>(null);

export function useWheelSheet() {
  return useContext(WheelSheetContext);
}

interface WheelSheetHostProps {
  children: ReactNode;
}







export function WheelSheetHost({ children }: WheelSheetHostProps) {
  const [request, setRequest] = useState<WheelSheetRequest | null>(null);
  const requestRef = useRef<WheelSheetRequest | null>(null);

  const open = useCallback((next: WheelSheetRequest) => {
    requestRef.current = next;
    setRequest(next);
  }, []);

  const close = useCallback(() => {
    requestRef.current = null;
    setRequest(null);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') return;

      
      
      
      const pending = requestRef.current;
      if (!pending) return;
      close();
      pending.onDismiss?.();
    });

    return () => subscription.remove();
  }, [close]);

  return (
    <WheelSheetContext.Provider value={open}>
      {children}
      {request && <Sheet request={request} onClosed={close} />}
    </WheelSheetContext.Provider>
  );
}

interface SheetProps {
  request: WheelSheetRequest;
  onClosed: () => void;
}

function Sheet({ request, onClosed }: SheetProps) {
  const theme = useTheme();
  const themeMode = useAppStore((state) => state.themeMode);
  const t = useT();
  const [draft, setDraft] = useState(request.value);
  const progress = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);
  
  
  
  
  
  const fallbackMinimum = new Date(
    request.value.getFullYear() - 100,
    0,
    1,
  );
  const fallbackMaximum = new Date(
    request.value.getFullYear() + 100,
    11,
    31,
    23,
    59,
    59,
    999,
  );
  const minimumDate = request.minimumDate ?? fallbackMinimum;
  const maximumDate = request.maximumDate ?? fallbackMaximum;
  
  
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    return () => progress.stopAnimation();
  }, [progress]);

  const closeAnimated = (afterClose: () => void) => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      onClosed();
      afterClose();
    });
  };

  const dismiss = () => {
    closeAnimated(() => request.onDismiss?.());
  };

  const confirm = (date: Date) => {
    closeAnimated(() => request.onConfirm(date));
  };

  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={draft}
        mode={request.mode}
        display="default"
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onChange={(event: DateTimePickerEvent, selected?: Date) => {
          if (event.type === 'set' && selected) confirm(selected);
          else dismiss();
        }}
      />
    );
  }

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [Math.max(320, height), 0],
  });

  return (
    <View style={[StyleSheet.absoluteFill, styles.presentation]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      </Animated.View>
      <Animated.View style={{ transform: [{ translateY }] }}>
      <ThemedView type="backgroundElement" style={styles.sheet}>
        <View style={[styles.sheetHeader, { borderBottomColor: theme.border }]}>
          <Pressable accessibilityRole="button" onPress={dismiss} hitSlop={12}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {t('editor.cancel')}
            </ThemedText>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => confirm(draft)} hitSlop={12}>
            <ThemedText type="smallBold" themeColor="primary">
              {t('common.done')}
            </ThemedText>
          </Pressable>
        </View>
        <DateTimePicker
          value={draft}
          mode={request.mode}
          display="spinner"
          themeVariant={themeMode}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={(_, selected) => selected && setDraft(selected)}
          style={{ width: width || Dimensions.get('window').width }}
        />
      </ThemedView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  presentation: {
    zIndex: 1000,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  sheet: {
    alignItems: 'center',
    paddingBottom: Spacing.six,
  },
  sheetHeader: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
