import useSWR from "swr";
import { ApiClient } from "../utils/apiClient";
import { BodyPartType } from "../app/schema/schema";

const fetchBodyParts = (url: string) => ApiClient.get<BodyPartType[]>(url);

export const useBodyParts = () => {
  const { data, error, isLoading } = useSWR("/api/body_part", fetchBodyParts);

  return {
    bodyParts: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
  };
};
