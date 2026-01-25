import { BodyPartType } from "../app/schema/schema";
import { TrainingItem } from "../hooks/useTrainingItems";
import { TrainingRecord } from "../hooks/useTrainingRecords";

export type TrainingItemMaxWeight = {
  trainingItemId: number;
  name: string;
  maxWeight: number;
  mainBodyPartName: string;
  secondaryBodyPartNames: string[];
};

export const buildMaxWeightsByItem = (
  records: TrainingRecord[],
  items: TrainingItem[],
  bodyParts: BodyPartType[],
): TrainingItemMaxWeight[] => {
  const itemNameMap = new Map(items.map((item) => [item.id, item.name]));
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const bodyPartNameMap = new Map(bodyParts.map((part) => [part.id, part.name]));
  const maxWeightMap = new Map<number, number>();

  records.forEach((record) => {
    const currentMax = maxWeightMap.get(record.trainingItemId);
    if (currentMax === undefined || record.weight > currentMax) {
      maxWeightMap.set(record.trainingItemId, record.weight);
    }
  });

  return Array.from(maxWeightMap.entries())
    .map(([trainingItemId, maxWeight]) => {
      const item = itemMap.get(trainingItemId);
      const mainBodyPartName =
        item?.bodyPartMasterId !== undefined
          ? (bodyPartNameMap.get(item.bodyPartMasterId) ?? "")
          : "";
      const secondaryBodyPartNames = (item?.secondaryBodyPartIds ?? [])
        .map((id) => bodyPartNameMap.get(id) ?? "")
        .filter((name) => name.length > 0);
      return {
        trainingItemId,
        name:
          itemNameMap.get(trainingItemId) ??
          records.find((record) => record.trainingItemId === trainingItemId)?.trainingItem?.name ??
          "",
        maxWeight,
        mainBodyPartName,
        secondaryBodyPartNames,
      };
    })
    .sort((a, b) => b.maxWeight - a.maxWeight);
};
