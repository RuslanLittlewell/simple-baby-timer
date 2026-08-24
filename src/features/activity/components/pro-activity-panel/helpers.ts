import { type ProDetails } from "@/lib/activity-store";

export type FeedingMode = "breast" | "bottle";
export type BreastSide = "left" | "right" | "both";
export type BottleContent = "formula" | "breastMilk";
export type ProKind = "settling" | "sleep" | "feeding";
export type SleepPlace = Extract<ProDetails, { type: "sleep" }>["place"];
export type SettlingMethod = Extract<
  ProDetails,
  { type: "settling" }
>["methods"][number];

export const SETTLING_METHODS: SettlingMethod[][] = [
  ["rocking", "fitball", "inArms"],
  ["crib", "pacifier", "whiteNoise"],
  ["music", "swaddling", "darkRoom"],
  ["walk", "independent"],
];

const pad2 = (value: number) => String(value).padStart(2, "0");

export const formatClock = (date: Date) =>
  `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

export const isNightWakingTime = (date = new Date()) => {
  const hour = date.getHours();
  return hour >= 22 || hour < 7;
};

export function parseVolumeMl(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

interface BuildDetailsOptions {
  settlingMethods: SettlingMethod[];
  sleepPlace: SleepPlace;
  mode: FeedingMode | null;
  side: BreastSide | null;
  content: BottleContent;
  volumeMl?: number;
}

export function buildProDetails(
  kind: ProKind,
  options: BuildDetailsOptions,
): ProDetails | null {
  if (kind === "settling") {
    return { type: "settling", methods: options.settlingMethods };
  }
  if (kind === "sleep") {
    return { type: "sleep", place: options.sleepPlace };
  }
  if (options.mode === "breast") {
    return options.side
      ? { type: "feeding", mode: "breast", side: options.side }
      : null;
  }
  if (options.mode === "bottle") {
    return {
      type: "feeding",
      mode: "bottle",
      content: options.content,
      volumeMl: options.volumeMl,
    };
  }
  return null;
}

export function toggleInSettlingMethods(
  methods: SettlingMethod[],
  method: SettlingMethod,
) {
  return methods.includes(method)
    ? methods.filter((item) => item !== method)
    : [...methods, method];
}

export const withAlpha = (hex: string, alpha: number) => {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
};
