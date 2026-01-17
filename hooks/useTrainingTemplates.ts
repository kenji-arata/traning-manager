import { useState, useEffect } from "react";
import { ApiClient } from "../utils/apiClient";

export type TrainingTemplate = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  trainingRecordTemplates: {
    id: number;
    trainingItemId: number;
    weight: number | null;
    repetitions: number | null;
    trainingItem: {
      id: number;
      name: string;
      bodyPart: string;
    };
  }[];
};

type CreateTemplateInput = {
  name: string;
  trainingRecordTemplates: {
    trainingItemId: number;
    weight?: number | null;
    repetitions?: number | null;
  }[];
};

type UpdateTemplateInput = {
  id: number;
  name: string;
  trainingRecordTemplates: {
    trainingItemId: number;
    weight?: number | null;
    repetitions?: number | null;
  }[];
};

export const useTrainingTemplates = () => {
  const [templates, setTemplates] = useState<TrainingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      const data = await ApiClient.get<TrainingTemplate[]>("/api/traning_template");
      setTemplates(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "データの取得に失敗しました");
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  const createTemplate = async (input: CreateTemplateInput): Promise<void> => {
    try {
      await ApiClient.post("/api/traning_template", input);
      await fetchTemplates(false);
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "登録に失敗しました");
    }
  };

  const updateTemplate = async (input: UpdateTemplateInput): Promise<void> => {
    try {
      await ApiClient.put("/api/traning_template", input);
      await fetchTemplates(false);
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "更新に失敗しました");
    }
  };

  const deleteTemplate = async (id: number): Promise<void> => {
    try {
      await ApiClient.delete(`/api/traning_template?id=${id}`);
      await fetchTemplates(false);
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "削除に失敗しました");
    }
  };

  useEffect(() => {
    fetchTemplates(true);
  }, []);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
};
