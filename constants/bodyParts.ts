import { BODY_PARTS } from "../app/schema/schema";

export const BODY_PART_LABELS: Record<keyof typeof BODY_PARTS, string> = {
  ARM: "腕",
  SHOULDER: "肩",
  CHEST: "胸",
  LEG: "脚",
  BACK: "背中",
  ABS: "腹筋",
};

export const BODY_PART_ORDER: (keyof typeof BODY_PARTS)[] = [
  "CHEST",
  "BACK",
  "SHOULDER",
  "ARM",
  "LEG",
  "ABS",
];
