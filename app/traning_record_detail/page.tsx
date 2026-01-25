"use client";

import { useMemo, useState } from "react";
import { useTrainingRecords } from "../../hooks/useTrainingRecords";
import { useTrainingItems } from "../../hooks/useTrainingItems";
import { useBodyParts } from "../../hooks/useBodyParts";
import { buildMaxWeightsByItem } from "../../utils/trainingRecordStats";

const formatLocalDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getDefaultRange = () => {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 3);
  return { startDate: formatLocalDate(start), endDate: formatLocalDate(end) };
};

export default function TrainingRecordDetailPage() {
  const defaultRange = useMemo(() => getDefaultRange(), []);
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const { records, loading, error } = useTrainingRecords(startDate, endDate);
  const { items } = useTrainingItems();
  const { bodyParts } = useBodyParts();
  const maxWeights = useMemo(
    () => buildMaxWeightsByItem(records, items, bodyParts),
    [records, items, bodyParts],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">実績詳細</h1>
          <p className="text-lg text-slate-600 mt-2">
            期間を指定してトレーニング実績の詳細を確認します。
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-slate-600">開始日</label>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-slate-600">終了日</label>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6">
          <div className="text-slate-900 font-semibold mb-4">種目別 最大重量</div>
          {loading && <div className="text-slate-600">読み込み中...</div>}
          {error && <div className="text-red-600">{error}</div>}
          {!loading && !error && maxWeights.length === 0 && (
            <div className="text-slate-600">指定期間の実績がありません。</div>
          )}
          {!loading && !error && maxWeights.length > 0 && (
            <div className="space-y-3">
              {maxWeights.map((item) => (
                <div
                  key={item.trainingItemId}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"
                >
                  <div>
                    <div className="text-slate-800 font-medium">{item.name || "名称未設定"}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {item.mainBodyPartName ? (
                        <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-medium text-white">
                          {item.mainBodyPartName}
                        </span>
                      ) : (
                        <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                          部位未設定
                        </span>
                      )}
                      {item.secondaryBodyPartNames.map((name) => (
                        <span
                          key={`${item.trainingItemId}-${name}`}
                          className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-slate-900 font-semibold">{item.maxWeight} kg</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
