import { useState, useEffect } from "react";
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

type CreateTrainingRecordInput = {
  date: string;
  trainingItemId: number;
  weight: number;
  repetitions: number;
};

type UpdateTrainingRecordInput = CreateTrainingRecordInput & {
  id: number;
};

/**
 * トレーニング記録のCRUD操作と状態管理を提供するhook
 */
export const useTrainingRecords = (initialDate?: string) => {
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * トレーニング記録を取得
   */
  const fetchRecords = async (
    startDate?: string,
    endDate?: string,
    trainingItemId?: number,
    isInitialLoad = false,
  ) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }

      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      if (trainingItemId) params.append("training_item_id", trainingItemId.toString());

      const queryString = params.toString();
      const path = `/api/traning_record${queryString ? `?${queryString}` : ""}`;

      const data = await ApiClient.get<TrainingRecord[]>(path);
      setRecords(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "データの取得に失敗しました");
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  /**
   * トレーニング記録を作成
   */
  const createRecord = async (input: CreateTrainingRecordInput): Promise<void> => {
    try {
      await ApiClient.post("/api/traning_record", input);
      await fetchRecords(input.date, input.date, undefined, false);
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "登録に失敗しました");
    }
  };

  /**
   * トレーニング記録を更新
   */
  const updateRecord = async (input: UpdateTrainingRecordInput): Promise<void> => {
    try {
      await ApiClient.put("/api/traning_record", input);
      await fetchRecords(input.date, input.date, undefined, false);
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "更新に失敗しました");
    }
  };

  /**
   * トレーニング記録を削除
   */
  const deleteRecord = async (id: number, date: string): Promise<void> => {
    try {
      await ApiClient.delete(`/api/traning_record?id=${id}`);
      await fetchRecords(date, date, undefined, false);
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "削除に失敗しました");
    }
  };
  /**
   * トレーニング記録を一括更新（洗い替え）
   */
  const replaceRecords = async (
    date: string,
    records: Array<{ trainingItemId: number; weight: number; repetitions: number }>,
  ): Promise<void> => {
    try {
      await ApiClient.patch("/api/traning_record", { date, records });
      await fetchRecords(date, date, undefined, false);
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "保存に失敗しました");
    }
  };

  /**
   * 初回マウント時にデータを取得
   */
  useEffect(() => {
    if (initialDate) {
      fetchRecords(initialDate, initialDate, undefined, true);
    } else {
      setLoading(false);
    }
  }, [initialDate]);

  return {
    records,
    loading,
    error,
    fetchRecords,
    createRecord,
    updateRecord,
    deleteRecord,
    replaceRecords,
  };
};
