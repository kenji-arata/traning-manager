import { useState, useEffect } from "react";
import { ApiClient } from "../utils/apiClient";
import { BODY_PARTS } from "../app/schema/schema";

export type TrainingItem = {
  id: number;
  name: string;
  bodyPart: keyof typeof BODY_PARTS;
  createdAt: string;
  updatedAt: string;
};

type CreateTrainingItemInput = {
  name: string;
  bodyPart: keyof typeof BODY_PARTS;
};

type UpdateTrainingItemInput = {
  id: number;
  name: string;
  bodyPart: keyof typeof BODY_PARTS;
};

/**
 * トレーニングアイテムのCRUD操作と状態管理を提供するhook
 */
export const useTrainingItems = () => {
  const [items, setItems] = useState<TrainingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * トレーニングアイテムを取得
   */
  const fetchItems = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }

      const data = await ApiClient.get<TrainingItem[]>("/api/training_item");
      setItems(data);
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
   * トレーニングアイテムを作成
   */
  const createItem = async (input: CreateTrainingItemInput): Promise<void> => {
    try {
      await ApiClient.post("/api/training_item", input);
      await fetchItems(false);
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "登録に失敗しました");
    }
  };

  /**
   * トレーニングアイテムを更新
   */
  const updateItem = async (input: UpdateTrainingItemInput): Promise<void> => {
    try {
      await ApiClient.put("/api/training_item", input);
      await fetchItems(false);
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "更新に失敗しました");
    }
  };

  /**
   * トレーニングアイテムを削除
   */
  const deleteItem = async (id: number): Promise<void> => {
    try {
      await ApiClient.delete(`/api/training_item?id=${id}`);
      await fetchItems(false);
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "削除に失敗しました");
    }
  };

  /**
   * 初回マウント時にデータを取得
   */
  useEffect(() => {
    fetchItems(true);
  }, []);

  return {
    items,
    loading,
    error,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
  };
};
