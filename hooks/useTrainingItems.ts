import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { ApiClient } from "../utils/apiClient";

export type TrainingItem = {
  id: number;
  name: string;
  bodyPartMasterId: number;
  bodyPartMaster?: {
    id: number;
    name: string;
  };
  secondaryBodyPartIds?: number[];
  createdAt: string;
  updatedAt: string;
};

const fetchTrainingItems = (url: string) => ApiClient.get<TrainingItem[]>(url);
const createTrainingItemMutation = (url: string, { arg }: { arg: CreateTrainingItemInput }) =>
  ApiClient.post<TrainingItem>(url, arg);
const updateTrainingItemMutation = (url: string, { arg }: { arg: UpdateTrainingItemInput }) =>
  ApiClient.put<TrainingItem>(url, arg);
const deleteTrainingItemMutation = (url: string, { arg }: { arg: { id: number } }) =>
  ApiClient.delete<{ message: string; deletedItem: TrainingItem }>(`${url}?id=${arg.id}`);

type CreateTrainingItemInput = {
  name: string;
  bodyPartMasterId: number;
  secondaryBodyPartIds?: number[];
};

type UpdateTrainingItemInput = {
  id: number;
  name: string;
  bodyPartMasterId: number;
  secondaryBodyPartIds?: number[];
};

type MutateTrainingItems = () => Promise<TrainingItem[] | undefined>;

const revalidateTrainingItems = async (mutate: MutateTrainingItems) => {
  await mutate();
};

export const useTrainingItems = () => {
  const { data, error, isLoading, mutate } = useSWR("/api/training_item", fetchTrainingItems);
  const { trigger: createTrigger } = useSWRMutation(
    "/api/training_item",
    createTrainingItemMutation,
  );
  const { trigger: updateTrigger } = useSWRMutation(
    "/api/training_item",
    updateTrainingItemMutation,
  );
  const { trigger: deleteTrigger } = useSWRMutation(
    "/api/training_item",
    deleteTrainingItemMutation,
  );

  const fetchItems = () => revalidateTrainingItems(mutate);
  const createItem = async (input: CreateTrainingItemInput): Promise<void> => {
    try {
      const optimisticId = Date.now() * -1;
      const now = new Date().toISOString();
      const optimisticItem: TrainingItem = {
        id: optimisticId,
        name: input.name,
        bodyPartMasterId: input.bodyPartMasterId,
        secondaryBodyPartIds: input.secondaryBodyPartIds ?? [],
        createdAt: now,
        updatedAt: now,
      };
      await createTrigger(input, {
        optimisticData: (current: TrainingItem[] | undefined) => [
          optimisticItem,
          ...(current ?? []),
        ],
        rollbackOnError: true,
        populateCache: (result, current: TrainingItem[] | undefined) => [
          result,
          ...(current ?? []).filter((item) => item.id !== optimisticId),
        ],
        revalidate: true,
      });
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "登録に失敗しました");
    }
  };
  const updateItem = async (input: UpdateTrainingItemInput): Promise<void> => {
    try {
      await updateTrigger(input, {
        optimisticData: (current: TrainingItem[] | undefined) =>
          (current ?? []).map((item) => (item.id === input.id ? { ...item, ...input } : item)),
        rollbackOnError: true,
        populateCache: (result, current: TrainingItem[] | undefined) =>
          (current ?? []).map((item) => (item.id === input.id ? result : item)),
        revalidate: true,
      });
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "更新に失敗しました");
    }
  };
  const deleteItem = async (id: number): Promise<void> => {
    try {
      await deleteTrigger(
        { id },
        {
          optimisticData: (current: TrainingItem[] | undefined) =>
            (current ?? []).filter((item) => item.id !== id),
          rollbackOnError: true,
          populateCache: (_result, current: TrainingItem[] | undefined) =>
            (current ?? []).filter((item) => item.id !== id),
          revalidate: true,
        },
      );
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "削除に失敗しました");
    }
  };

  return {
    items: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
  };
};
