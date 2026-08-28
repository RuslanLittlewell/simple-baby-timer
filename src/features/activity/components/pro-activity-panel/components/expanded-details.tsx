import { TextInput, View } from "react-native";
import { type ComponentProps } from "react";

import { WheelField } from "@/components/wheel-field";
import { useT } from "@/state/app-state";

import {
  formatClock,
  SETTLING_METHODS,
  withAlpha,
  type BottleContent,
  type BreastSide,
  type FeedingMode,
  type ProKind,
  type SettlingMethod,
  type SleepPlace,
} from "../helpers";
import { styles } from "../styles";
import { Choice } from "./choice";

interface ExpandedDetailsProps {
  bottleStart: Date;
  color: string;
  content: BottleContent;
  kind: ProKind;
  mode: FeedingMode | null;
  settlingMethods: SettlingMethod[];
  side: BreastSide | null;
  sleepPlace: SleepPlace;
  volume: string;
  onBottleStartChange: (value: Date) => void;
  onChooseMode: (mode: FeedingMode) => void;
  onContentChange: (content: BottleContent) => void;
  onSettlingMethodToggle: (method: SettlingMethod) => void;
  onSideChange: (side: BreastSide) => void;
  onSleepPlaceChange: (place: SleepPlace) => void;
  onVolumeChange: (volume: string) => void;
}

export function ExpandedDetails(props: ExpandedDetailsProps) {
  const t = useT();

  if (props.kind === "settling") {
    return (
      <View style={styles.sleepOptions}>
        {SETTLING_METHODS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.options}>
            {row.map((method) => (
              <Choice key={method} tone="sleep" label={t(`pro.${method}`)} selected={props.settlingMethods.includes(method)} multiline onPress={() => props.onSettlingMethodToggle(method)} />
            ))}
          </View>
        ))}
      </View>
    );
  }

  if (props.kind === "sleep") {
    const places: { icon: ComponentProps<typeof Choice>["icon"]; label: string; value: SleepPlace }[][] = [
      [
        { icon: "bed-single-outline", label: t("pro.crib"), value: "crib" },
        { icon: "baby-carriage", label: t("pro.stroller"), value: "stroller" },
        { icon: "car-child-seat", label: t("pro.carSeat"), value: "carSeat" },
      ],
      [
        { icon: "bed-double-outline", label: t("pro.coSleeping"), value: "coSleeping" },
        { icon: "kangaroo", label: t("pro.carrier"), value: "carrier" },
        { icon: "mother-heart", label: t("pro.inArms"), value: "inArms" },
      ],
    ];
    return (
      <View style={styles.sleepOptions}>
        {places.map((row, index) => (
          <View key={index} style={styles.options}>
            {row.map((place) => (
              <Choice key={place.value} tone="sleep" icon={place.icon} label={place.label} selected={props.sleepPlace === place.value} onPress={() => props.onSleepPlaceChange(place.value)} />
            ))}
          </View>
        ))}
      </View>
    );
  }

  if (props.mode === null) {
    return (
      <View style={[styles.step, styles.stepFill]}>
        <Choice icon="mother-heart" label={t("pro.breast")} selected={false} onPress={() => props.onChooseMode("breast")} />
        <Choice icon="baby-bottle" label={t("pro.bottle")} selected={false} onPress={() => props.onChooseMode("bottle")} />
      </View>
    );
  }

  if (props.mode === "breast") {
    return (
      <View style={styles.breastSides}>
        <View style={[styles.step, styles.breastSidesTop]}>
          <Choice label={t("pro.left")} selected={props.side === "left"} onPress={() => props.onSideChange("left")} />
          <Choice label={t("pro.right")} selected={props.side === "right"} onPress={() => props.onSideChange("right")} />
        </View>
        <View style={[styles.step, styles.breastSidesBottom]}>
          <Choice label={t("pro.both")} selected={props.side === "both"} onPress={() => props.onSideChange("both")} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.bottle}>
      <View style={[styles.step, styles.bottleField]}>
        <WheelField mode="time" value={props.bottleStart} maximumDate={new Date()} openOnMount displayText={`${t("editor.start")} · ${formatClock(props.bottleStart)}`} onChange={props.onBottleStartChange} style={[styles.wheel, { borderColor: withAlpha(props.color, 0.34), backgroundColor: withAlpha(props.color, 0.1) }]} textStyle={[styles.wheelText, { color: props.color }]} />
      </View>
      <TextInput accessibilityLabel={t("pro.volume")} value={props.volume} onChangeText={(value) => props.onVolumeChange(value.replace(/\D/g, "").slice(0, 4))} keyboardType="number-pad" placeholder={t("pro.volume")} placeholderTextColor="rgba(62,45,25,0.58)" style={[styles.volume, { color: props.color, borderColor: withAlpha(props.color, 0.34), backgroundColor: withAlpha(props.color, 0.1) }]} />
      <View style={[styles.step, styles.bottleChoiceRow]}>
        <Choice label={t("pro.formula")} selected={props.content === "formula"} onPress={() => props.onContentChange("formula")} />
        <Choice label={t("pro.breastMilk")} selected={props.content === "breastMilk"} onPress={() => props.onContentChange("breastMilk")} />
      </View>
    </View>
  );
}
