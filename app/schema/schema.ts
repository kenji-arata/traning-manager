import { z } from "zod";

export const BodyPartSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type BodyPartType = z.infer<typeof BodyPartSchema>;

export const TrainingItemSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "名前を入力してください"),
  bodyPartMasterId: z.number(),
  secondaryBodyPartIds: z.array(z.number()).optional(),
});

export type TrainingItemInput = z.infer<typeof TrainingItemSchema>;

export const TrainingRecordSchema = z.object({
  id: z.number().optional(),
  date: z.date(),
  trainingItemId: z.number(),
  weight: z.number(),
  repetitions: z.number().int().min(0, "回数は0以上で入力してください"),
});

export type TrainingRecordInput = z.infer<typeof TrainingRecordSchema>;

export const TrainingTemplateSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "テンプレート名を入力してください"),
});

export type TrainingTemplateInput = z.infer<typeof TrainingTemplateSchema>;

export const TrainingRecordTemplateSchema = z.object({
  id: z.number().optional(),
  trainingTemplateId: z.number(),
  trainingItemId: z.number(),
  weight: z.number().nullable().optional(),
  repetitions: z.number().int().nullable().optional(),
});

export type TrainingRecordTemplateInput = z.infer<typeof TrainingRecordTemplateSchema>;

export const TrainingTemplateWithRecordsSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "テンプレート名を入力してください"),
  trainingRecordTemplates: z.array(
    z.object({
      id: z.number().optional(),
      trainingItemId: z.number(),
      weight: z.number().nullable().optional(),
      repetitions: z.number().int().nullable().optional(),
    }),
  ),
});

export type TrainingTemplateWithRecordsInput = z.infer<typeof TrainingTemplateWithRecordsSchema>;
