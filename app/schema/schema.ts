import { z } from "zod";

export const ScoreSchema = z.object({
  mode: z.enum(["NORMAL", "ONE_SHOT"]),
  score: z.number().min(0),
});
