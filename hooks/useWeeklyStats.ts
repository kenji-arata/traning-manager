import { useState, useCallback, useEffect } from "react";
import useSWR from "swr";
import { ApiClient } from "../utils/apiClient";

export type BodyPartStats = {
  name: string;
  sets: number;
};

export type WeeklyStats = {
  weekStart: string;
  bodyParts: BodyPartStats[];
};

const fetchWeeklyStats = (url: string) => ApiClient.get<WeeklyStats[]>(url);

const EMPTY_STATS: WeeklyStats[] = [];

type QueryParams = {
  startDate?: string;
  endDate?: string;
};

const buildPath = ({ startDate, endDate }: QueryParams) => {
  const params = new URLSearchParams();
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  const queryString = params.toString();
  return `/api/traning_record/weekly_stats${queryString ? `?${queryString}` : ""}`;
};

export const useWeeklyStats = (initialStartDate?: string, initialEndDate?: string) => {
  const [query, setQuery] = useState<QueryParams | null>(
    initialStartDate && initialEndDate
      ? { startDate: initialStartDate, endDate: initialEndDate }
      : null,
  );
  const key = query ? buildPath(query) : null;
  const { data, error, isLoading } = useSWR<WeeklyStats[]>(key, fetchWeeklyStats);

  // 初期パラメータが変わったら、queryを更新
  useEffect(() => {
    if (initialStartDate && initialEndDate) {
      setQuery({ startDate: initialStartDate, endDate: initialEndDate });
    }
  }, [initialStartDate, initialEndDate]);

  /**
   * 週次統計を取得
   */
  const fetchStats = useCallback((startDate: string, endDate: string) => {
    setQuery({ startDate, endDate });
  }, []);

  return {
    stats: data ?? EMPTY_STATS,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    fetchStats,
  };
};
