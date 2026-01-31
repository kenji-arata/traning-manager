"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@headlessui/react";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  FitnessCenter as FitnessCenterIcon,
  CalendarToday as CalendarTodayIcon,
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  ListAlt as ListAltIcon,
  Refresh as RefreshIcon,
  RotateLeft as RotateLeftIcon,
  DragIndicator as DragIndicatorIcon,
} from "@mui/icons-material";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTrainingItems } from "../../../hooks/useTrainingItems";
import { useTrainingRecords } from "../../../hooks/useTrainingRecords";
import { useTrainingTemplates } from "../../../hooks/useTrainingTemplates";
import { useBodyParts } from "../../../hooks/useBodyParts";

type LocalRecord = {
  id: string;
  trainingItemId: number;
  weight: number | null;
  repetitions: number | null;
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
    updateItemRecords,
    deleteRecord,
  } = useTrainingRecords(date);
  const { templates, loading: templatesLoading } = useTrainingTemplates();
  const { bodyParts } = useBodyParts();

  const [localRecords, setLocalRecords] = useState<LocalRecord[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [expandedBodyParts, setExpandedBodyParts] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingItemIds, setSavingItemIds] = useState<Set<number>>(new Set());
  const [formError, setFormError] = useState<string | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [itemOrder, setItemOrder] = useState<number[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setFormError("無効な日付形式です (yyyy-mm-dd)");
    }
  }, [date]);

  useEffect(() => {
    const converted = savedRecords.map((record) => ({
      id: `saved-${record.id}`,
      trainingItemId: record.trainingItemId,
      weight: record.weight,
      repetitions: record.repetitions,
    }));
    setLocalRecords(converted);
  }, [savedRecords]);

  const hasUnsavedChanges = (() => {
    if (localRecords.length !== savedRecords.length) return true;
    const sortedLocal = [...localRecords].sort((a, b) => {
      if (a.trainingItemId !== b.trainingItemId) return a.trainingItemId - b.trainingItemId;
      const aWeight = a.weight ?? -1;
      const bWeight = b.weight ?? -1;
      if (aWeight !== bWeight) return aWeight - bWeight;
      const aReps = a.repetitions ?? -1;
      const bReps = b.repetitions ?? -1;
      return aReps - bReps;
    });
    const sortedSaved = [...savedRecords].sort((a, b) => {
      if (a.trainingItemId !== b.trainingItemId) return a.trainingItemId - b.trainingItemId;
      if (a.weight !== b.weight) return a.weight - b.weight;
      return a.repetitions - b.repetitions;
    });
    for (let i = 0; i < sortedLocal.length; i++) {
      if (
        sortedLocal[i].trainingItemId !== sortedSaved[i].trainingItemId ||
        sortedLocal[i].weight !== sortedSaved[i].weight ||
        sortedLocal[i].repetitions !== sortedSaved[i].repetitions
      ) {
        return true;
      }
    }
    return false;
  })();

  const groupedRecordsUnsorted: GroupedRecords[] = trainingItems
    .map((item) => {
      const itemRecords = localRecords.filter((record) => record.trainingItemId === item.id);
      return {
        trainingItemId: item.id,
        trainingItemName: item.name,
        bodyPart: item.bodyPartMaster?.name || "",
        records: itemRecords,
      };
    })
    .filter((group) => group.records.length > 0);

  // itemOrderに基づいて並び替え
  const groupedRecords: GroupedRecords[] = [...groupedRecordsUnsorted].sort((a, b) => {
    const aIndex = itemOrder.indexOf(a.trainingItemId);
    const bIndex = itemOrder.indexOf(b.trainingItemId);
    // itemOrderにない場合は末尾に
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  // itemOrderの初期化・更新（新しい種目が追加された場合に対応）
  const currentItemIds = groupedRecordsUnsorted.map((g) => g.trainingItemId);
  const currentItemIdsKey = currentItemIds.join(",");
  useEffect(() => {
    setItemOrder((prev) => {
      // 既存の順序を保持しつつ、新しいアイテムを末尾に追加
      const existingOrder = prev.filter((id) => currentItemIds.includes(id));
      const newItems = currentItemIds.filter((id) => !prev.includes(id));
      return [...existingOrder, ...newItems];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItemIdsKey]);

  const availableItems = trainingItems.filter(
    (item) => !localRecords.some((record) => record.trainingItemId === item.id),
  );

  const availableItemsByBodyPart = availableItems.reduce(
    (acc, item) => {
      const bodyPartName = item.bodyPartMaster?.name || "";
      if (!acc[bodyPartName]) {
        acc[bodyPartName] = [];
      }
      acc[bodyPartName].push(item);
      return acc;
    },
    {} as Record<string, typeof availableItems>,
  );

  const bodyPartOrder = bodyParts.map((bodyPart) => bodyPart.name);
  const sortedBodyParts = Object.keys(availableItemsByBodyPart).sort((a, b) => {
    const aIndex = bodyPartOrder.indexOf(a);
    const bIndex = bodyPartOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b, "ja");
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

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

  const toggleBodyPart = (bodyPart: string) => {
    setExpandedBodyParts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(bodyPart)) {
        newSet.delete(bodyPart);
      } else {
        newSet.add(bodyPart);
      }
      return newSet;
    });
  };

  const handleAddTrainingItem = (trainingItemId: number) => {
    const newRecord: LocalRecord = {
      id: `temp-${Date.now()}-${Math.random()}`,
      trainingItemId,
      weight: null,
      repetitions: null,
    };
    setLocalRecords((prev) => [...prev, newRecord]);
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      newSet.add(trainingItemId);
      return newSet;
    });
  };

  const handleAddRecord = (trainingItemId: number) => {
    // 同じtrainingItemIdの最後のレコードから重量を取得
    const lastRecord = localRecords.filter((r) => r.trainingItemId === trainingItemId).slice(-1)[0];

    const newRecord: LocalRecord = {
      id: `temp-${Date.now()}-${Math.random()}`,
      trainingItemId,
      weight: lastRecord?.weight ?? null,
      repetitions: 0,
    };
    setLocalRecords((prev) => [...prev, newRecord]);
  };

  const handleDeleteRecord = async (id: string) => {
    // 保存済みレコード（saved- で始まるID）の場合はAPIを呼び出して削除
    if (id.startsWith("saved-")) {
      const recordId = parseInt(id.replace("saved-", ""), 10);
      if (!isNaN(recordId)) {
        try {
          await deleteRecord(recordId);
          // API削除が成功したら、ローカルステートからも削除
          setLocalRecords((prev) => prev.filter((record) => record.id !== id));
        } catch (e) {
          setFormError(e instanceof Error ? e.message : "削除に失敗しました");
        }
        return;
      }
    }
    // 未保存のレコード（temp- や template- で始まるID）の場合はローカルステートから削除のみ
    setLocalRecords((prev) => prev.filter((record) => record.id !== id));
  };

  const handleUpdateRecord = (id: string, weight: number | null, repetitions: number | null) => {
    setLocalRecords((prev) =>
      prev.map((record) => (record.id === id ? { ...record, weight, repetitions } : record)),
    );
  };

  const handleReorderItems = (activeId: number, overId: number) => {
    setItemOrder((prev) => {
      const oldIndex = prev.indexOf(activeId);
      const newIndex = prev.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleResetChanges = useCallback(() => {
    const converted = savedRecords.map((record) => ({
      id: `saved-${record.id}`,
      trainingItemId: record.trainingItemId,
      weight: record.weight,
      repetitions: record.repetitions,
    }));
    setLocalRecords(converted);
    setFormError(null);
  }, [savedRecords]);

  const handleSaveAll = useCallback(async () => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const recordsToSave = localRecords
        .filter((record) => record.weight !== null && record.repetitions !== null)
        .map((record) => ({
          trainingItemId: record.trainingItemId,
          weight: record.weight!,
          repetitions: record.repetitions!,
        }));
      await replaceRecords(date, recordsToSave);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  }, [localRecords, replaceRecords, date]);

  const handleSaveItem = useCallback(
    async (trainingItemId: number) => {
      setSavingItemIds((prev) => new Set(prev).add(trainingItemId));
      setFormError(null);
      try {
        const itemRecords = localRecords
          .filter(
            (record) =>
              record.trainingItemId === trainingItemId &&
              record.weight !== null &&
              record.repetitions !== null,
          )
          .map((record) => ({
            trainingItemId: record.trainingItemId,
            weight: record.weight!,
            repetitions: record.repetitions!,
          }));

        if (itemRecords.length === 0) {
          setFormError("保存するデータがありません");
          return;
        }

        // 種目ごとの更新（他種目に影響を与えない）
        await updateItemRecords(date, trainingItemId, itemRecords);
      } catch (e) {
        setFormError(e instanceof Error ? e.message : "保存に失敗しました");
      } finally {
        setSavingItemIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(trainingItemId);
          return newSet;
        });
      }
    },
    [localRecords, updateItemRecords, date],
  );

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

        <div className="space-y-4">
          {groupedRecords.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
              <FitnessCenterIcon sx={{ fontSize: 64, color: "#94a3b8", mb: 2 }} />
              <h3 className="text-lg font-medium text-slate-900 mb-2">まだ記録がありません</h3>
              <p className="text-slate-600">トレーニング種目を選択して記録を追加しましょう</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                  トレーニング種目別記録 ({groupedRecords.length}種目)
                </h2>
                {hasUnsavedChanges && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleResetChanges}
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-500 text-white text-sm font-medium rounded-lg hover:bg-slate-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                      <RefreshIcon sx={{ fontSize: 18 }} />
                      <span className="hidden xs:inline sm:inline">リセット</span>
                    </button>
                    <button
                      onClick={handleSaveAll}
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                      <SaveIcon sx={{ fontSize: 18 }} />
                      <span className="hidden xs:inline sm:inline">
                        {isSubmitting ? "保存中..." : "保存"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event: DragEndEvent) => {
                  const { active, over } = event;
                  if (over && active.id !== over.id) {
                    handleReorderItems(active.id as number, over.id as number);
                  }
                }}
              >
                <SortableContext
                  items={groupedRecords.map((g) => g.trainingItemId)}
                  strategy={verticalListSortingStrategy}
                >
                  {groupedRecords.map((group) => (
                    <SortableTrainingItemCard
                      key={group.trainingItemId}
                      group={group}
                      isExpanded={expandedItems.has(group.trainingItemId)}
                      isSaving={savingItemIds.has(group.trainingItemId)}
                      localRecords={localRecords}
                      savedRecords={savedRecords}
                      onToggleExpand={toggleExpand}
                      onSaveItem={handleSaveItem}
                      onUpdateRecord={handleUpdateRecord}
                      onDeleteRecord={handleDeleteRecord}
                      onAddRecord={handleAddRecord}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </>
          )}
        </div>

        <div className="my-8 border-t-2 border-slate-200"></div>

        <div className="space-y-6">
          <div className="flex gap-3">
            {!showTemplateSelector && (
              <button
                onClick={() => setShowTemplateSelector(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/25"
              >
                <ListAltIcon sx={{ fontSize: 20 }} />
                <span>テンプレートから読み込む</span>
              </button>
            )}
          </div>

          {showTemplateSelector && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6">
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

          {availableItems.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                トレーニング種目を追加
              </h2>
              <div className="space-y-2">
                {sortedBodyParts.map((bodyPart) => {
                  const items = availableItemsByBodyPart[bodyPart];
                  const isExpanded = expandedBodyParts.has(bodyPart);
                  const label = bodyPart;
                  return (
                    <div
                      key={bodyPart}
                      className="border border-slate-200 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleBodyPart(bodyPart)}
                        className="w-full px-4 py-2.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <span className="font-medium text-slate-900">{label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">{items.length}種目</span>
                          <ExpandMoreIcon
                            sx={{
                              fontSize: 20,
                              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.2s",
                            }}
                            className="text-slate-400"
                          />
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="p-2 bg-white">
                          <div className="grid grid-cols-3 gap-2">
                            {items.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => handleAddTrainingItem(item.id)}
                                className="px-3 py-2 text-sm bg-slate-50 hover:bg-green-50 border border-slate-200 hover:border-green-300 rounded-md transition-colors text-left font-medium text-slate-900"
                              >
                                {item.name}
                              </button>
                            ))}
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
      </div>
    </div>
  );
}

type SortableTrainingItemCardProps = {
  group: GroupedRecords;
  isExpanded: boolean;
  isSaving: boolean;
  localRecords: LocalRecord[];
  savedRecords: { id: number; trainingItemId: number; weight: number; repetitions: number }[];
  onToggleExpand: (trainingItemId: number) => void;
  onSaveItem: (trainingItemId: number) => void;
  onUpdateRecord: (id: string, weight: number | null, repetitions: number | null) => void;
  onDeleteRecord: (id: string) => void;
  onAddRecord: (trainingItemId: number) => void;
};

function SortableTrainingItemCard({
  group,
  isExpanded,
  isSaving,
  localRecords,
  savedRecords,
  onToggleExpand,
  onSaveItem,
  onUpdateRecord,
  onDeleteRecord,
  onAddRecord,
}: SortableTrainingItemCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.trainingItemId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : "auto",
  };

  const hasValidRecords = group.records.some(
    (record) => record.weight !== null && record.repetitions !== null,
  );

  const hasZeroRepRecords = group.records.some((record) => record.repetitions === 0);
  const zeroRepCount = group.records.filter((record) => record.repetitions === 0).length;

  const itemHasUnsavedChanges = (() => {
    const itemLocalRecords = localRecords.filter((r) => r.trainingItemId === group.trainingItemId);
    const itemSavedRecords = savedRecords.filter((r) => r.trainingItemId === group.trainingItemId);

    if (itemLocalRecords.length !== itemSavedRecords.length) return true;

    const sortedLocal = [...itemLocalRecords].sort((a, b) => {
      const aWeight = a.weight ?? -1;
      const bWeight = b.weight ?? -1;
      if (aWeight !== bWeight) return aWeight - bWeight;
      const aReps = a.repetitions ?? -1;
      const bReps = b.repetitions ?? -1;
      return aReps - bReps;
    });

    const sortedSaved = [...itemSavedRecords].sort((a, b) => {
      if (a.weight !== b.weight) return a.weight - b.weight;
      return a.repetitions - b.repetitions;
    });

    for (let i = 0; i < sortedLocal.length; i++) {
      if (
        sortedLocal[i].weight !== sortedSaved[i].weight ||
        sortedLocal[i].repetitions !== sortedSaved[i].repetitions
      ) {
        return true;
      }
    }
    return false;
  })();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3 flex-1">
          <button
            {...listeners}
            className="p-1 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing touch-none"
            aria-label="ドラッグして並び替え"
          >
            <DragIndicatorIcon sx={{ fontSize: 20 }} />
          </button>
          <button
            onClick={() => onToggleExpand(group.trainingItemId)}
            className="flex items-center gap-3 flex-1"
          >
            <FitnessCenterIcon sx={{ fontSize: 24 }} className="text-blue-600" />
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-900">{group.trainingItemName}</h3>
                {hasZeroRepRecords && (
                  <span
                    className="flex items-center justify-center w-6 h-6 bg-orange-100 rounded-full"
                    title={`0回のセット: ${zeroRepCount}件`}
                  >
                    <RotateLeftIcon sx={{ fontSize: 16 }} className="text-orange-700" />
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600">{group.records.length}セット</p>
            </div>
          </button>
        </div>
        <div className="flex items-center gap-2">
          {hasValidRecords && itemHasUnsavedChanges && (
            <button
              onClick={() => onSaveItem(group.trainingItemId)}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              <SaveIcon sx={{ fontSize: 16 }} />
              <span>{isSaving ? "保存中..." : "保存"}</span>
            </button>
          )}
          <button
            onClick={() => onToggleExpand(group.trainingItemId)}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            aria-label="展開/折りたたみ"
          >
            <ExpandMoreIcon
              sx={{
                fontSize: 28,
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            />
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="px-5 pb-4 border-t border-slate-200">
          <div className="mt-4 space-y-2">
            {group.records.map((record, recordIndex) => (
              <RecordItem
                key={record.id}
                record={record}
                recordIndex={recordIndex}
                onUpdate={onUpdateRecord}
                onDelete={onDeleteRecord}
                onAddRecord={onAddRecord}
                trainingItemId={group.trainingItemId}
                isLastRecord={recordIndex === group.records.length - 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RecordItem({
  record,
  recordIndex,
  onUpdate,
  onDelete,
  onAddRecord,
  trainingItemId,
  isLastRecord,
}: {
  record: LocalRecord;
  recordIndex: number;
  onUpdate: (id: string, weight: number | null, repetitions: number | null) => void;
  onDelete: (id: string) => void;
  onAddRecord: (trainingItemId: number) => void;
  trainingItemId: number;
  isLastRecord: boolean;
}) {
  const [weight, setWeight] = useState<number | null>(record.weight);
  const [repetitions, setRepetitions] = useState<number | null>(record.repetitions);
  const handleWeightChange = (value: number | null) => {
    setWeight(value);
    onUpdate(record.id, value, repetitions);
  };
  const handleRepetitionsChange = (value: number | null) => {
    setRepetitions(value);
    onUpdate(record.id, weight, value);
  };
  return (
    <div className="p-3 sm:p-4 bg-slate-50 rounded-lg">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-700 text-sm">セット {recordIndex + 1}</span>
          <div className="flex items-center gap-1">
            {isLastRecord && (
              <button
                onClick={() => onAddRecord(trainingItemId)}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                aria-label="セットを追加"
              >
                <AddIcon sx={{ fontSize: 18 }} />
              </button>
            )}
            <button
              onClick={() => onDelete(record.id)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="削除"
            >
              <DeleteIcon sx={{ fontSize: 18 }} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min="0"
              placeholder="重量"
              value={weight ?? ""}
              onChange={(e) =>
                handleWeightChange(e.target.value === "" ? null : Number(e.target.value))
              }
              className="w-16 px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-xs text-slate-500 w-6">kg</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min="0"
              placeholder="回数"
              value={repetitions ?? ""}
              onChange={(e) =>
                handleRepetitionsChange(e.target.value === "" ? null : Number(e.target.value))
              }
              className="w-16 px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-xs text-slate-500 w-6">rep</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
            <span className="text-xs text-slate-600">総重量:</span>
            <span className="font-bold text-purple-600 text-sm">
              {(weight ?? 0) * (repetitions ?? 0)} kg
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
