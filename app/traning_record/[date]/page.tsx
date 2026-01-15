"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  FitnessCenter as FitnessCenterIcon,
  CalendarToday as CalendarTodayIcon,
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useTrainingItems } from "../../../hooks/useTrainingItems";
import { useTrainingRecords } from "../../../hooks/useTrainingRecords";

type RecordFormData = {
  weight: number;
  repetitions: number;
};

type GroupedRecords = {
  trainingItemId: number;
  trainingItemName: string;
  bodyPart: string;
  records: Array<{
    id: number;
    weight: number;
    repetitions: number;
    createdAt: string;
  }>;
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
    updateRecord,
    deleteRecord,
  } = useTrainingRecords(date);

  // 各種目のトグル開閉状態を管理
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  // 各種目のフォーム表示状態を管理
  const [visibleForms, setVisibleForms] = useState<Set<number>>(new Set());
  // 各種目のフォームデータを管理
  const [formDataMap, setFormDataMap] = useState<Map<number, RecordFormData>>(new Map());
  // 新規トレーニング登録フォームの表示状態
  const [showNewTrainingForm, setShowNewTrainingForm] = useState(false);
  // 新規トレーニング登録フォームのデータ
  const [newTrainingFormData, setNewTrainingFormData] = useState({
    trainingItemId: trainingItems.length > 0 ? trainingItems[0].id : null,
    weight: 0,
    repetitions: 0,
  });
  // 編集中のレコードID
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  // 編集中のレコードデータ
  const [editingData, setEditingData] = useState<RecordFormData>({
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

  // トレーニング種目が読み込まれたら、新規フォームの初期値を設定
  useEffect(() => {
    if (trainingItems.length > 0 && newTrainingFormData.trainingItemId === null) {
      setNewTrainingFormData((prev) => ({
        ...prev,
        trainingItemId: trainingItems[0].id,
      }));
    }
  }, [trainingItems, newTrainingFormData.trainingItemId]);

  // 記録をトレーニング種目ごとにグループ化
  const groupedRecords: GroupedRecords[] = trainingItems
    .map((item) => {
      const itemRecords = records.filter((record) => record.trainingItemId === item.id);
      return {
        trainingItemId: item.id,
        trainingItemName: item.name,
        bodyPart: item.bodyPart,
        records: itemRecords.map((record) => ({
          id: record.id,
          weight: record.weight,
          repetitions: record.repetitions,
          createdAt: record.createdAt,
        })),
      };
    })
    .filter((group) => group.records.length > 0);

  // トグルの開閉を切り替え
  const toggleExpand = (trainingItemId: number) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(trainingItemId)) {
        newSet.delete(trainingItemId);
      } else {
        newSet.add(trainingItemId);
      }
      return newSet;
    });
  };

  // フォーム表示を切り替え
  const toggleForm = (trainingItemId: number) => {
    setVisibleForms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(trainingItemId)) {
        newSet.delete(trainingItemId);
      } else {
        newSet.add(trainingItemId);
        // フォームを表示する際、初期値を設定
        if (!formDataMap.has(trainingItemId)) {
          setFormDataMap((prevMap) => {
            const newMap = new Map(prevMap);
            newMap.set(trainingItemId, { weight: 0, repetitions: 0 });
            return newMap;
          });
        }
      }
      return newSet;
    });
  };

  // フォームデータを更新
  const updateFormData = (trainingItemId: number, field: keyof RecordFormData, value: number) => {
    setFormDataMap((prevMap) => {
      const newMap = new Map(prevMap);
      const currentData = newMap.get(trainingItemId) || { weight: 0, repetitions: 0 };
      newMap.set(trainingItemId, { ...currentData, [field]: value });
      return newMap;
    });
  };

  const handleSubmit = async (e: React.FormEvent, trainingItemId: number) => {
    e.preventDefault();
    setFormError(null);

    const formData = formDataMap.get(trainingItemId);
    if (!formData) {
      setFormError("フォームデータが見つかりません");
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
        trainingItemId,
        weight: formData.weight,
        repetitions: formData.repetitions,
      });

      // フォームをリセット
      setFormDataMap((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set(trainingItemId, { weight: 0, repetitions: 0 });
        return newMap;
      });
      setVisibleForms((prev) => {
        const newSet = new Set(prev);
        newSet.delete(trainingItemId);
        return newSet;
      });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "登録に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewTrainingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (newTrainingFormData.trainingItemId === null) {
      setFormError("トレーニング種目を選択してください");
      return;
    }

    if (newTrainingFormData.weight <= 0) {
      setFormError("重量は0より大きい値を入力してください");
      return;
    }

    if (newTrainingFormData.repetitions <= 0) {
      setFormError("回数は1以上の値を入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      await createRecord({
        date,
        trainingItemId: newTrainingFormData.trainingItemId,
        weight: newTrainingFormData.weight,
        repetitions: newTrainingFormData.repetitions,
      });

      // フォームをリセット
      setNewTrainingFormData({
        trainingItemId: trainingItems.length > 0 ? trainingItems[0].id : null,
        weight: 0,
        repetitions: 0,
      });
      setShowNewTrainingForm(false);

      // 登録した種目を自動的に開く
      if (newTrainingFormData.trainingItemId) {
        setExpandedItems((prev) => {
          const newSet = new Set(prev);
          newSet.add(newTrainingFormData.trainingItemId!);
          return newSet;
        });
      }
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

  const handleEditStart = (record: { id: number; weight: number; repetitions: number }) => {
    setEditingRecordId(record.id);
    setEditingData({
      weight: record.weight,
      repetitions: record.repetitions,
    });
    setFormError(null);
  };

  const handleEditCancel = () => {
    setEditingRecordId(null);
    setEditingData({ weight: 0, repetitions: 0 });
    setFormError(null);
  };

  const handleEditSave = async (recordId: number, trainingItemId: number) => {
    setFormError(null);

    if (editingData.weight <= 0) {
      setFormError("重量は0より大きい値を入力してください");
      return;
    }

    if (editingData.repetitions <= 0) {
      setFormError("回数は1以上の値を入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      await updateRecord({
        id: recordId,
        date,
        trainingItemId,
        weight: editingData.weight,
        repetitions: editingData.repetitions,
      });

      setEditingRecordId(null);
      setEditingData({ weight: 0, repetitions: 0 });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "更新に失敗しました");
    } finally {
      setIsSubmitting(false);
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

        {/* 新しいトレーニングを登録ボタン */}
        {!showNewTrainingForm && (
          <button
            onClick={() => setShowNewTrainingForm(true)}
            className="mb-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-600/25"
          >
            <AddIcon sx={{ fontSize: 20 }} />
            <span>新しいトレーニングを登録</span>
          </button>
        )}

        {/* 新しいトレーニング登録フォーム */}
        {showNewTrainingForm && (
          <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-lg p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FitnessCenterIcon sx={{ fontSize: 24 }} />
              新しいトレーニングを登録
            </h2>

            <form onSubmit={handleNewTrainingSubmit} className="space-y-4">
              {/* トレーニング種目 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  トレーニング種目 <span className="text-red-500">*</span>
                </label>
                <select
                  value={newTrainingFormData.trainingItemId ?? ""}
                  onChange={(e) =>
                    setNewTrainingFormData({
                      ...newTrainingFormData,
                      trainingItemId: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
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
                  value={newTrainingFormData.weight}
                  onChange={(e) =>
                    setNewTrainingFormData({
                      ...newTrainingFormData,
                      weight: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
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
                  value={newTrainingFormData.repetitions}
                  onChange={(e) =>
                    setNewTrainingFormData({
                      ...newTrainingFormData,
                      repetitions: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="例: 10"
                  required
                />
              </div>

              {/* ボタン */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? "登録中..." : "登録"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewTrainingForm(false);
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

        {/* トレーニング種目別の記録リスト */}
        <div className="space-y-4">
          {groupedRecords.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
              <FitnessCenterIcon sx={{ fontSize: 64, color: "#94a3b8", mb: 2 }} />
              <h3 className="text-lg font-medium text-slate-900 mb-2">まだ記録がありません</h3>
              <p className="text-slate-600">今日のトレーニング記録を追加しましょう</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                トレーニング種目別記録 ({groupedRecords.length}種目)
              </h2>
              {groupedRecords.map((group, index) => {
                const isExpanded = expandedItems.has(group.trainingItemId);
                const isFormVisible = visibleForms.has(group.trainingItemId);
                const formData = formDataMap.get(group.trainingItemId) || {
                  weight: 0,
                  repetitions: 0,
                };

                return (
                  <div
                    key={group.trainingItemId}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* 種目ヘッダー（クリックでトグル） */}
                    <button
                      onClick={() => toggleExpand(group.trainingItemId)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FitnessCenterIcon sx={{ fontSize: 24 }} className="text-blue-600" />
                        <div className="text-left">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {group.trainingItemName}
                          </h3>
                          <p className="text-sm text-slate-600">{group.records.length}セット</p>
                        </div>
                      </div>
                      <ExpandMoreIcon
                        sx={{
                          fontSize: 28,
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                        className="text-slate-400"
                      />
                    </button>

                    {/* トグル内容（記録一覧と新規登録フォーム） */}
                    {isExpanded && (
                      <div className="px-5 pb-4 border-t border-slate-200">
                        {/* 新規登録ボタン */}
                        {!isFormVisible && (
                          <button
                            onClick={() => toggleForm(group.trainingItemId)}
                            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <AddIcon sx={{ fontSize: 20 }} />
                            <span>新しいセットを追加</span>
                          </button>
                        )}

                        {/* 登録フォーム */}
                        {isFormVisible && (
                          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                            <h4 className="text-sm font-semibold text-slate-900 mb-3">
                              新しいセットを追加
                            </h4>

                            <form
                              onSubmit={(e) => handleSubmit(e, group.trainingItemId)}
                              className="space-y-3"
                            >
                              {/* 重量 */}
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  重量 (kg) <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  value={formData.weight}
                                  onChange={(e) =>
                                    updateFormData(
                                      group.trainingItemId,
                                      "weight",
                                      Number(e.target.value),
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                  placeholder="例: 50"
                                  required
                                />
                              </div>

                              {/* 回数 */}
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  回数 (rep) <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={formData.repetitions}
                                  onChange={(e) =>
                                    updateFormData(
                                      group.trainingItemId,
                                      "repetitions",
                                      Number(e.target.value),
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                  placeholder="例: 10"
                                  required
                                />
                              </div>

                              {/* ボタン */}
                              <div className="flex gap-2 pt-1">
                                <button
                                  type="submit"
                                  disabled={isSubmitting}
                                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors text-sm"
                                >
                                  {isSubmitting ? "登録中..." : "登録"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    toggleForm(group.trainingItemId);
                                    setFormError(null);
                                  }}
                                  className="px-4 py-2 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors text-sm"
                                >
                                  キャンセル
                                </button>
                              </div>
                            </form>
                          </div>
                        )}

                        {/* 記録一覧 */}
                        <div className="mt-4 space-y-2">
                          {group.records.map((record, recordIndex) => {
                            const isEditing = editingRecordId === record.id;

                            return (
                              <div
                                key={record.id}
                                className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                              >
                                {isEditing ? (
                                  // 編集モード
                                  <div className="space-y-3">
                                    <div className="font-medium text-slate-700 text-sm mb-2">
                                      セット {recordIndex + 1} を編集
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      {/* 重量入力 */}
                                      <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                          重量 (kg)
                                        </label>
                                        <input
                                          type="number"
                                          step="0.5"
                                          min="0"
                                          value={editingData.weight}
                                          onChange={(e) =>
                                            setEditingData({
                                              ...editingData,
                                              weight: Number(e.target.value),
                                            })
                                          }
                                          className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                      </div>
                                      {/* 回数入力 */}
                                      <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                          回数 (rep)
                                        </label>
                                        <input
                                          type="number"
                                          min="1"
                                          value={editingData.repetitions}
                                          onChange={(e) =>
                                            setEditingData({
                                              ...editingData,
                                              repetitions: Number(e.target.value),
                                            })
                                          }
                                          className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                      </div>
                                    </div>
                                    {/* ボタン */}
                                    <div className="flex gap-2 pt-1">
                                      <button
                                        onClick={() =>
                                          handleEditSave(record.id, group.trainingItemId)
                                        }
                                        disabled={isSubmitting}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                                      >
                                        <SaveIcon sx={{ fontSize: 16 }} />
                                        <span>保存</span>
                                      </button>
                                      <button
                                        onClick={handleEditCancel}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 transition-colors"
                                      >
                                        <CloseIcon sx={{ fontSize: 16 }} />
                                        <span>キャンセル</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  // 表示モード
                                  <div className="flex items-center justify-between">
                                    <div className="flex flex-wrap items-center gap-4 text-sm">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-slate-700">
                                          セット {recordIndex + 1}:
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-slate-600">重量:</span>
                                        <span className="font-bold text-blue-600">
                                          {record.weight} kg
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-slate-600">回数:</span>
                                        <span className="font-bold text-green-600">
                                          {record.repetitions} rep
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-slate-600">総重量:</span>
                                        <span className="font-bold text-purple-600">
                                          {record.weight * record.repetitions} kg
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => handleEditStart(record)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        aria-label="編集"
                                      >
                                        <EditIcon sx={{ fontSize: 18 }} />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(record.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        aria-label="削除"
                                      >
                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
