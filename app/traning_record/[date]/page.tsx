"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@headlessui/react";
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
  CheckCircle as CheckCircleIcon,
  ListAlt as ListAltIcon,
} from "@mui/icons-material";
import { useTrainingItems } from "../../../hooks/useTrainingItems";
import { useTrainingRecords } from "../../../hooks/useTrainingRecords";
import { useTrainingTemplates } from "../../../hooks/useTrainingTemplates";

type LocalRecord = {
  id: string;
  trainingItemId: number;
  weight: number;
  repetitions: number;
};

type GroupedRecords = {
  trainingItemId: number;
  trainingItemName: string;
  bodyPart: string;
  records: LocalRecord[];
};

export default function TrainingRecordPage() {
  const params = useParams();
  const router = useRouter();
  const date = params.date as string;

  const { items: trainingItems, loading: itemsLoading } = useTrainingItems();
  const {
    records: savedRecords,
    loading: recordsLoading,
    replaceRecords,
  } = useTrainingRecords(date);
  const { templates, loading: templatesLoading } = useTrainingTemplates();

  const [localRecords, setLocalRecords] = useState<LocalRecord[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [visibleForms, setVisibleForms] = useState<Set<number>>(new Set());
  const [showNewTrainingForm, setShowNewTrainingForm] = useState(false);
  const [newTrainingFormData, setNewTrainingFormData] = useState({
    trainingItemId: trainingItems.length > 0 ? trainingItems[0].id : null,
    weight: "" as number | "",
    repetitions: "" as number | "",
  });
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState({
    weight: 0,
    repetitions: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  useEffect(() => {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setFormError("無効な日付形式です (yyyy-mm-dd)");
    }
  }, [date]);

  useEffect(() => {
    if (trainingItems.length > 0 && newTrainingFormData.trainingItemId === null) {
      setNewTrainingFormData((prev) => ({
        ...prev,
        trainingItemId: trainingItems[0].id,
      }));
    }
  }, [trainingItems, newTrainingFormData.trainingItemId]);

  useEffect(() => {
    const converted = savedRecords.map((record) => ({
      id: `saved-${record.id}`,
      trainingItemId: record.trainingItemId,
      weight: record.weight,
      repetitions: record.repetitions,
    }));
    setLocalRecords(converted);
    setHasUnsavedChanges(false);
  }, [savedRecords]);

  const groupedRecords: GroupedRecords[] = trainingItems
    .map((item) => {
      const itemRecords = localRecords.filter((record) => record.trainingItemId === item.id);
      return {
        trainingItemId: item.id,
        trainingItemName: item.name,
        bodyPart: item.bodyPart,
        records: itemRecords,
      };
    })
    .filter((group) => group.records.length > 0);

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

  const toggleForm = (trainingItemId: number) => {
    setVisibleForms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(trainingItemId)) {
        newSet.delete(trainingItemId);
      } else {
        newSet.add(trainingItemId);
      }
      return newSet;
    });
  };

  const handleAddRecord = (trainingItemId: number, weight: number, repetitions: number) => {
    const newRecord: LocalRecord = {
      id: `temp-${Date.now()}-${Math.random()}`,
      trainingItemId,
      weight,
      repetitions,
    };
    setLocalRecords((prev) => [...prev, newRecord]);
    setHasUnsavedChanges(true);
    toggleForm(trainingItemId);
  };

  const handleNewTrainingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (newTrainingFormData.trainingItemId === null) {
      setFormError("トレーニング種目を選択してください");
      return;
    }
    if (newTrainingFormData.weight === "" || newTrainingFormData.weight <= 0) {
      setFormError("重量は0より大きい値を入力してください");
      return;
    }
    if (newTrainingFormData.repetitions === "" || newTrainingFormData.repetitions <= 0) {
      setFormError("回数は1以上の値を入力してください");
      return;
    }
    handleAddRecord(
      newTrainingFormData.trainingItemId,
      Number(newTrainingFormData.weight),
      Number(newTrainingFormData.repetitions),
    );
    setNewTrainingFormData({
      trainingItemId: trainingItems.length > 0 ? trainingItems[0].id : null,
      weight: "",
      repetitions: "",
    });
    setShowNewTrainingForm(false);
    if (newTrainingFormData.trainingItemId) {
      setExpandedItems((prev) => {
        const newSet = new Set(prev);
        newSet.add(newTrainingFormData.trainingItemId!);
        return newSet;
      });
    }
  };

  const handleDeleteRecord = (id: string) => {
    setLocalRecords((prev) => prev.filter((record) => record.id !== id));
    setHasUnsavedChanges(true);
  };

  const handleEditStart = (record: LocalRecord) => {
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

  const handleEditSave = (recordId: string) => {
    setFormError(null);
    if (editingData.weight <= 0) {
      setFormError("重量は0より大きい値を入力してください");
      return;
    }
    if (editingData.repetitions <= 0) {
      setFormError("回数は1以上の値を入力してください");
      return;
    }
    setLocalRecords((prev) =>
      prev.map((record) =>
        record.id === recordId
          ? { ...record, weight: editingData.weight, repetitions: editingData.repetitions }
          : record,
      ),
    );
    setHasUnsavedChanges(true);
    setEditingRecordId(null);
    setEditingData({ weight: 0, repetitions: 0 });
  };

  const handleSaveAll = async () => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const recordsToSave = localRecords.map((record) => ({
        trainingItemId: record.trainingItemId,
        weight: record.weight,
        repetitions: record.repetitions,
      }));
      await replaceRecords(date, recordsToSave);
      setHasUnsavedChanges(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyTemplate = (templateId: number) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    const newRecords: LocalRecord[] = template.trainingRecordTemplates.map((rt, index) => ({
      id: `template-${Date.now()}-${index}`,
      trainingItemId: rt.trainingItemId,
      weight: rt.weight ?? 0,
      repetitions: rt.repetitions ?? 0,
    }));
    setLocalRecords(newRecords);
    setHasUnsavedChanges(true);
    setShowTemplateSelector(false);
    const itemIds = new Set(newRecords.map((r) => r.trainingItemId));
    setExpandedItems(itemIds);
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

  if (itemsLoading || recordsLoading || templatesLoading) {
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

        {formError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-800 font-medium">{formError}</p>
          </div>
        )}

        {hasUnsavedChanges && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center justify-between">
            <p className="text-yellow-800 font-medium">未保存の変更があります</p>
            <button
              onClick={handleSaveAll}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              <SaveIcon sx={{ fontSize: 20 }} />
              <span>{isSubmitting ? "保存中..." : "保存"}</span>
            </button>
          </div>
        )}

        <div className="mb-6 flex gap-3">
          {!showTemplateSelector && (
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/25"
            >
              <ListAltIcon sx={{ fontSize: 20 }} />
              <span>テンプレートから読み込む</span>
            </button>
          )}
          {!showNewTrainingForm && (
            <button
              onClick={() => setShowNewTrainingForm(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-600/25"
            >
              <AddIcon sx={{ fontSize: 20 }} />
              <span>新しいトレーニングを登録</span>
            </button>
          )}
        </div>

        {showTemplateSelector && (
          <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <ListAltIcon sx={{ fontSize: 24 }} />
                テンプレートを選択
              </h2>
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <CloseIcon sx={{ fontSize: 24 }} />
              </button>
            </div>
            {templates.length === 0 ? (
              <p className="text-slate-600 text-center py-4">テンプレートが登録されていません</p>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleApplyTemplate(template.id)}
                    className="w-full p-4 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-lg transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">{template.name}</h3>
                        <p className="text-sm text-slate-600">
                          {template.trainingRecordTemplates.length} 種目
                        </p>
                      </div>
                      <CheckCircleIcon sx={{ fontSize: 24 }} className="text-purple-600" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {showNewTrainingForm && (
          <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-lg p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FitnessCenterIcon sx={{ fontSize: 24 }} />
              新しいトレーニングを登録
            </h2>
            <form onSubmit={handleNewTrainingSubmit} className="space-y-4">
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  重量 (kg) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  value={newTrainingFormData.weight}
                  onChange={(e) =>
                    setNewTrainingFormData({
                      ...newTrainingFormData,
                      weight: e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  回数 (rep) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  value={newTrainingFormData.repetitions}
                  onChange={(e) =>
                    setNewTrainingFormData({
                      ...newTrainingFormData,
                      repetitions: e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  追加
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
                return (
                  <div
                    key={group.trainingItemId}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
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
                    {isExpanded && (
                      <div className="px-5 pb-4 border-t border-slate-200">
                        {!isFormVisible && (
                          <button
                            onClick={() => toggleForm(group.trainingItemId)}
                            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <AddIcon sx={{ fontSize: 20 }} />
                            <span>新しいセットを追加</span>
                          </button>
                        )}
                        {isFormVisible && (
                          <AddSetForm
                            trainingItemId={group.trainingItemId}
                            onAdd={handleAddRecord}
                            onCancel={() => toggleForm(group.trainingItemId)}
                          />
                        )}
                        <div className="mt-4 space-y-2">
                          {group.records.map((record, recordIndex) => {
                            const isEditing = editingRecordId === record.id;
                            return (
                              <div
                                key={record.id}
                                className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                              >
                                {isEditing ? (
                                  <div className="space-y-3">
                                    <div className="font-medium text-slate-700 text-sm mb-2">
                                      セット {recordIndex + 1} を編集
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                          重量 (kg)
                                        </label>
                                        <Input
                                          type="number"
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
                                      <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                          回数 (rep)
                                        </label>
                                        <Input
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
                                    <div className="flex gap-2 pt-1">
                                      <button
                                        onClick={() => handleEditSave(record.id)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
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
                                        onClick={() => handleDeleteRecord(record.id)}
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

function AddSetForm({
  trainingItemId,
  onAdd,
  onCancel,
}: {
  trainingItemId: number;
  onAdd: (trainingItemId: number, weight: number, repetitions: number) => void;
  onCancel: () => void;
}) {
  const [weight, setWeight] = useState<number | "">("");
  const [repetitions, setRepetitions] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (weight === "" || weight <= 0) {
      setError("重量は0より大きい値を入力してください");
      return;
    }
    if (repetitions === "" || repetitions <= 0) {
      setError("回数は1以上の値を入力してください");
      return;
    }
    onAdd(trainingItemId, Number(weight), Number(repetitions));
    setWeight("");
    setRepetitions("");
  };
  return (
    <div className="mt-4 p-4 bg-slate-50 rounded-lg">
      <h4 className="text-sm font-semibold text-slate-900 mb-3">新しいセットを追加</h4>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            重量 (kg) <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            回数 (rep) <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            min="1"
            value={repetitions}
            onChange={(e) => setRepetitions(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            required
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            追加
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors text-sm"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
