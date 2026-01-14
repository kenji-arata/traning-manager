"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FitnessCenter as FitnessCenterIcon,
  CalendarToday as CalendarTodayIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { useTrainingItems } from "../../../hooks/useTrainingItems";
import { useTrainingRecords } from "../../../hooks/useTrainingRecords";

type RecordFormData = {
  trainingItemId: number | null;
  weight: number;
  repetitions: number;
};

export default function TrainingRecordPage() {
  const params = useParams();
  const router = useRouter();
  const date = params.date as string;

  const { items: trainingItems, loading: itemsLoading } = useTrainingItems();
  const {
    records,
    loading: recordsLoading,
    error,
    createRecord,
    deleteRecord,
  } = useTrainingRecords(date);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState<RecordFormData>({
    trainingItemId: null,
    weight: 0,
    repetitions: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 日付の妥当性チェック
  useEffect(() => {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setFormError("無効な日付形式です (yyyy-mm-dd)");
    }
  }, [date]);

  // フォームの初期化
  useEffect(() => {
    if (trainingItems.length > 0 && formData.trainingItemId === null) {
      setFormData((prev) => ({
        ...prev,
        trainingItemId: trainingItems[0].id,
      }));
    }
  }, [trainingItems, formData.trainingItemId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (formData.trainingItemId === null) {
      setFormError("トレーニング種目を選択してください");
      return;
    }

    if (formData.weight <= 0) {
      setFormError("重量は0より大きい値を入力してください");
      return;
    }

    if (formData.repetitions <= 0) {
      setFormError("回数は1以上の値を入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      await createRecord({
        date,
        trainingItemId: formData.trainingItemId,
        weight: formData.weight,
        repetitions: formData.repetitions,
      });

      // フォームをリセット
      setFormData({
        trainingItemId: trainingItems.length > 0 ? trainingItems[0].id : null,
        weight: 0,
        repetitions: 0,
      });
      setIsFormVisible(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "登録に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("この記録を削除しますか?")) {
      return;
    }

    try {
      await deleteRecord(id, date);
    } catch (e) {
      alert(e instanceof Error ? e.message : "削除に失敗しました");
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  if (itemsLoading || recordsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-600 font-medium">読み込み中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* ヘッダー */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowBackIcon sx={{ fontSize: 20 }} />
            <span className="text-sm font-medium">戻る</span>
          </button>

          <div className="flex items-center gap-3 mb-2">
            <CalendarTodayIcon sx={{ fontSize: 32 }} className="text-blue-600" />
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">トレーニング記録</h1>
          </div>
          <p className="text-lg text-slate-600 ml-11">{formatDate(date)}</p>
        </div>

        {/* エラー表示 */}
        {(error || formError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-800 font-medium">{error || formError}</p>
          </div>
        )}

        {/* 新規登録ボタン */}
        {!isFormVisible && (
          <button
            onClick={() => setIsFormVisible(true)}
            className="mb-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
          >
            <AddIcon sx={{ fontSize: 20 }} />
            <span>新しい記録を追加</span>
          </button>
        )}

        {/* 登録フォーム */}
        {isFormVisible && (
          <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-lg p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FitnessCenterIcon sx={{ fontSize: 24 }} />
              記録を追加
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* トレーニング種目 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  トレーニング種目 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.trainingItemId ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, trainingItemId: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                >
                  {trainingItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 重量 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  重量 (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="例: 50"
                  required
                />
              </div>

              {/* 回数 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  回数 (rep) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.repetitions}
                  onChange={(e) =>
                    setFormData({ ...formData, repetitions: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="例: 10"
                  required
                />
              </div>

              {/* ボタン */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? "登録中..." : "登録"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFormVisible(false);
                    setFormError(null);
                  }}
                  className="px-4 py-2.5 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 記録リスト */}
        <div className="space-y-3">
          {records.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
              <FitnessCenterIcon sx={{ fontSize: 64, color: "#94a3b8", mb: 2 }} />
              <h3 className="text-lg font-medium text-slate-900 mb-2">まだ記録がありません</h3>
              <p className="text-slate-600">今日のトレーニング記録を追加しましょう</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                記録一覧 ({records.length}件)
              </h2>
              {records.map((record, index) => (
                <div
                  key={record.id}
                  className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <FitnessCenterIcon sx={{ fontSize: 24 }} className="text-blue-600" />
                          <h3 className="text-lg font-semibold text-slate-900">
                            {record.trainingItem.name}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">重量:</span>
                            <span className="text-lg font-bold text-blue-600">
                              {record.weight} kg
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">回数:</span>
                            <span className="text-lg font-bold text-green-600">
                              {record.repetitions} rep
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">総重量:</span>
                            <span className="text-lg font-bold text-purple-600">
                              {record.weight * record.repetitions} kg
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="削除"
                        >
                          <DeleteIcon sx={{ fontSize: 20 }} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
