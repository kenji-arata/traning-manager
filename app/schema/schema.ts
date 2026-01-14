import { z } from "zod";

export const ScoreSchema = z.object({
  mode: z.enum(["NORMAL", "ONE_SHOT"]),
  score: z.number().min(0),
});

export const BODY_PARTS = {
  ARM: "ARM",
  SHOULDER: "SHOULDER",
  CHEST: "CHEST",
  LEG: "LEG",
  BACK: "BACK",
  ABS: "ABS",
} as const;

export type BodyPart = (typeof BODY_PARTS)[keyof typeof BODY_PARTS];

export const TrainingItemSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "名前を入力してください"),
  bodyPart: z.enum([
    BODY_PARTS.ARM,
    BODY_PARTS.SHOULDER,
    BODY_PARTS.CHEST,
    BODY_PARTS.LEG,
    BODY_PARTS.BACK,
    BODY_PARTS.ABS,
  ]),
});

export type TrainingItemInput = z.infer<typeof TrainingItemSchema>;

export const TrainingRecordSchema = z.object({
  id: z.number().optional(),
  date: z.date(),
  trainingItemId: z.number(),
  weight: z.number(),
  repetitions: z.number().int().min(1, "回数は1以上で入力してください"),
});

export type TrainingRecordInput = z.infer<typeof TrainingRecordSchema>;
