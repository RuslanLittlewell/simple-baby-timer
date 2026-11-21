import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { DiaperIcon } from "@/components/icons/diaper-icon";
import { FeedingBottleIcon } from "@/components/icons/feeding-bottle-icon";

import { type IconName } from "../constants";

interface ActivityIconProps {
  name: IconName;
  size: number;
  color: string;
}

export function ActivityIcon({ name, size, color }: ActivityIconProps) {
  if (name === "baby-bottle-outline") return <FeedingBottleIcon size={size} color={color} />;
  if (name === "diaper-outline") return <DiaperIcon size={size} color={color} />;
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}
