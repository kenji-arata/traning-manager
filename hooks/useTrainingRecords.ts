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

type TrainingRecordInput = {
  trainingItemId: number;
  weight: number;
  repetitions: number;
};

const buildPath = ({ startDate, endDate, trainingItemId }: QueryParams) => {
  const params = new URLSearchParams();
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  if (trainingItemId) params.append("training_item_id", trainingItemId.toString());
  const queryString = params.toString();
  return `/api/traning_record${queryString ? `?${queryString}` : ""}`;
};

const isTrainingRecordKey = (key: unknown): key is string =>
  typeof key === "string" && key.startsWith("/api/traning_record");

const buildOptimisticRecords = (
  date: string,
  records: TrainingRecordInput[],
  now: string,
  current: TrainingRecord[] | undefined,
): TrainingRecord[] => {
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
  const replaceRecords = async (date: string, records: TrainingRecordInput[]): Promise<void> => {
    const targetKey = buildPath({ startDate: date, endDate: date });
    const now = new Date().toISOString();
    try {
      await globalMutate(
        targetKey,
        (current: TrainingRecord[] | undefined) =>
          buildOptimisticRecords(date, records, now, current),
        false,
      );
      await ApiClient.patch("/api/traning_record", { date, records });
      await globalMutate((key) => isTrainingRecordKey(key) && key !== targetKey);
    } catch (e) {
      await globalMutate(isTrainingRecordKey);
      throw new Error(e instanceof Error ? e.message : "保存に失敗しました");
    }
  };

  /**
   * PATCHエンドポイントを使って実績を作成（一括置換）
   */
  const createRecords = async (
    date: string,
    records: TrainingRecordInput[],
  ): Promise<TrainingRecord[]> => {
    const targetKey = buildPath({ startDate: date, endDate: date });
    const now = new Date().toISOString();
    try {
      await globalMutate(
        targetKey,
        (current: TrainingRecord[] | undefined) =>
          buildOptimisticRecords(date, records, now, current),
        false,
      );
      const result = await ApiClient.patch<TrainingRecord[]>("/api/traning_record", {
        date,
        records,
      });
      await globalMutate(targetKey, result, false);
      await globalMutate((key) => isTrainingRecordKey(key) && key !== targetKey);
      return result;
    } catch (e) {
      await globalMutate(isTrainingRecordKey);
      throw new Error(e instanceof Error ? e.message : "実績の作成に失敗しました");
    }
  };

  /**
   * DELETEエンドポイントを使って実績を削除
   */
  const deleteRecord = async (id: number): Promise<void> => {
    try {
      // 楽観的更新：全てのキャッシュから該当レコードを削除
      await globalMutate(
        isTrainingRecordKey,
        (current: TrainingRecord[] | undefined) => {
          if (!current) return current;
          return current.filter((record) => record.id !== id);
        },
        false,
      );
      await ApiClient.delete(`/api/traning_record?id=${id}`);
      // 全てのキャッシュを再検証（削除されたレコードがどのクエリに含まれていたか不明なため）
      await globalMutate(isTrainingRecordKey);
    } catch (e) {
      // エラー時は全てのキャッシュを再検証してロールバック
      await globalMutate(isTrainingRecordKey);
      throw new Error(e instanceof Error ? e.message : "実績の削除に失敗しました");
    }
  };

  return {
    records: data ?? EMPTY_RECORDS,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    fetchRecords,
    replaceRecords,
    createRecords,
    deleteRecord,
  };
};
