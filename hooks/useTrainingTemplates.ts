import useSWR from "swr";
import useSWRMutation from "swr/mutation";
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

const fetchTrainingTemplates = (url: string) => ApiClient.get<TrainingTemplate[]>(url);
const createTrainingTemplateMutation = (url: string, { arg }: { arg: CreateTemplateInput }) =>
  ApiClient.post<TrainingTemplate>(url, arg);
const updateTrainingTemplateMutation = (url: string, { arg }: { arg: UpdateTemplateInput }) =>
  ApiClient.put<TrainingTemplate>(url, arg);
const deleteTrainingTemplateMutation = (url: string, { arg }: { arg: { id: number } }) =>
  ApiClient.delete<{ message: string; deletedItem: TrainingTemplate }>(`${url}?id=${arg.id}`);

type MutateTrainingTemplates = () => Promise<TrainingTemplate[] | undefined>;

const revalidateTrainingTemplates = async (mutate: MutateTrainingTemplates) => {
  await mutate();
};

export const useTrainingTemplates = () => {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/traning_template",
    fetchTrainingTemplates,
  );
  const { trigger: createTrigger } = useSWRMutation(
    "/api/traning_template",
    createTrainingTemplateMutation,
  );
  const { trigger: updateTrigger } = useSWRMutation(
    "/api/traning_template",
    updateTrainingTemplateMutation,
  );
  const { trigger: deleteTrigger } = useSWRMutation(
    "/api/traning_template",
    deleteTrainingTemplateMutation,
  );

  const fetchTemplates = () => revalidateTrainingTemplates(mutate);

  const createTemplate = async (input: CreateTemplateInput): Promise<void> => {
    try {
      const optimisticId = Date.now() * -1;
      const now = new Date().toISOString();
      const optimisticTemplate: TrainingTemplate = {
        id: optimisticId,
        name: input.name,
        createdAt: now,
        updatedAt: now,
        trainingRecordTemplates: input.trainingRecordTemplates.map((record, index) => ({
          id: (Date.now() + index) * -1,
          trainingItemId: record.trainingItemId,
          weight: record.weight ?? null,
          repetitions: record.repetitions ?? null,
          trainingItem: {
            id: record.trainingItemId,
            name: "",
            bodyPart: "",
          },
        })),
      };
      await createTrigger(input, {
        optimisticData: (current: TrainingTemplate[] | undefined) => [
          optimisticTemplate,
          ...(current ?? []),
        ],
        rollbackOnError: true,
        populateCache: (result, current: TrainingTemplate[] | undefined) => [
          result,
          ...(current ?? []).filter((template) => template.id !== optimisticId),
        ],
        revalidate: true,
      });
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "登録に失敗しました");
    }
  };

  const updateTemplate = async (input: UpdateTemplateInput): Promise<void> => {
    try {
      await updateTrigger(input, {
        optimisticData: (current: TrainingTemplate[] | undefined) =>
          (current ?? []).map((template) => {
            if (template.id !== input.id) return template;
            const itemMap = new Map(
              template.trainingRecordTemplates.map((record) => [
                record.trainingItemId,
                record.trainingItem,
              ]),
            );
            return {
              ...template,
              name: input.name,
              trainingRecordTemplates: input.trainingRecordTemplates.map((record, index) => ({
                id: template.trainingRecordTemplates[index]?.id ?? (Date.now() + index) * -1,
                trainingItemId: record.trainingItemId,
                weight: record.weight ?? null,
                repetitions: record.repetitions ?? null,
                trainingItem: itemMap.get(record.trainingItemId) ?? {
                  id: record.trainingItemId,
                  name: "",
                  bodyPart: "",
                },
              })),
            };
          }),
        rollbackOnError: true,
        populateCache: (result, current: TrainingTemplate[] | undefined) =>
          (current ?? []).map((template) => (template.id === input.id ? result : template)),
        revalidate: true,
      });
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "更新に失敗しました");
    }
  };

  const deleteTemplate = async (id: number): Promise<void> => {
    try {
      await deleteTrigger(
        { id },
        {
          optimisticData: (current: TrainingTemplate[] | undefined) =>
            (current ?? []).filter((template) => template.id !== id),
          rollbackOnError: true,
          populateCache: (_result, current: TrainingTemplate[] | undefined) =>
            (current ?? []).filter((template) => template.id !== id),
          revalidate: true,
        },
      );
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "削除に失敗しました");
    }
  };

  return {
    templates: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
};
