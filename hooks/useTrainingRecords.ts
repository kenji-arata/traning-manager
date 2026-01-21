import { useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { ApiClient } from "../utils/apiClient";

export type TrainingRecord = {
  id: number;
  date: string;
  trainingItemId: number;
  weight: number;
  repetitions: number;
  createdAt: string;
  updatedAt: string;
  trainingItem: {
    id: number;
    name: string;
    bodyPart: string;
  };
};

const fetchTrainingRecords = (url: string) => ApiClient.get<TrainingRecord[]>(url);

const EMPTY_RECORDS: TrainingRecord[] = [];

type QueryParams = {
  startDate?: string;
  endDate?: string;
  trainingItemId?: number;
};

const buildPath = ({ startDate, endDate, trainingItemId }: QueryParams) => {
  const params = new URLSearchParams();
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  if (trainingItemId) params.append("training_item_id", trainingItemId.toString());
  const queryString = params.toString();
  return `/api/traning_record${queryString ? `?${queryString}` : ""}`;
};

export const useTrainingRecords = (initialDate?: string) => {
  const [query, setQuery] = useState<QueryParams | null>(
    initialDate ? { startDate: initialDate, endDate: initialDate } : null,
  );
  const key = query ? buildPath(query) : null;
  const { data, error, isLoading } = useSWR<TrainingRecord[]>(key, fetchTrainingRecords);

  /**
   * トレーニング記録を取得
   */
  const fetchRecords = async (startDate?: string, endDate?: string, trainingItemId?: number) => {
    try {
      const nextQuery = { startDate, endDate, trainingItemId };
      setQuery(nextQuery);
      const nextKey = buildPath(nextQuery);
      await globalMutate(nextKey);
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "データの取得に失敗しました");
    }
  };

  /**
   * トレーニング記録を一括更新（洗い替え）
   */
  const replaceRecords = async (
    date: string,
    records: Array<{ trainingItemId: number; weight: number; repetitions: number }>,
  ): Promise<void> => {
    const targetKey = buildPath({ startDate: date, endDate: date });
    const now = new Date().toISOString();
    try {
      await globalMutate(
        targetKey,
        (current: TrainingRecord[] | undefined) => {
          const existing = current ?? [];
          const trainingItemMap = new Map(
            existing.map((record) => [record.trainingItemId, record.trainingItem]),
          );
          return records.map((record, index) => ({
            id: (Date.now() + index) * -1,
            date,
            trainingItemId: record.trainingItemId,
            weight: record.weight,
            repetitions: record.repetitions,
            createdAt: now,
            updatedAt: now,
            trainingItem: trainingItemMap.get(record.trainingItemId) ?? {
              id: record.trainingItemId,
              name: "",
              bodyPart: "",
            },
          }));
        },
        false,
      );
      await ApiClient.patch("/api/traning_record", { date, records });
      await globalMutate(targetKey);
    } catch (e) {
      await globalMutate(targetKey);
      throw new Error(e instanceof Error ? e.message : "保存に失敗しました");
    }
  };

  return {
    records: data ?? EMPTY_RECORDS,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    fetchRecords,
    replaceRecords,
  };
};
