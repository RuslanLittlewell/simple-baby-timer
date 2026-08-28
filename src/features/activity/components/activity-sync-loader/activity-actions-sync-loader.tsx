import { View } from "react-native";

import { ActivitySyncIndicator } from "./activity-sync-indicator";
import { styles } from "./styles";

interface ActivityActionsSyncLoaderProps {
  accessibilityLabel: string;
  visible: boolean;
}

export function ActivityActionsSyncLoader({
  accessibilityLabel,
  visible,
}: ActivityActionsSyncLoaderProps) {
  if (!visible) return null;

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <ActivitySyncIndicator accessibilityLabel={accessibilityLabel} />
    </View>
  );
}
