"use client";

import { useState } from "react";
import {
  ListAlt as ListAltIcon,
  FitnessCenter as FitnessCenterIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { useTrainingTemplates } from "../../hooks/useTrainingTemplates";
import TrainingTemplateModal from "./TrainingTemplateModal";

const bodyPartLabels: Record<string, string> = {
  ARM: "腕",
  SHOULDER: "肩",
  CHEST: "胸",
  LEG: "脚",
  BACK: "背中",
  ABS: "腹筋",
};

const bodyPartColors: Record<string, string> = {
  ARM: "bg-purple-100 text-purple-800 border-purple-200",
  SHOULDER: "bg-orange-100 text-orange-800 border-orange-200",
  CHEST: "bg-blue-100 text-blue-800 border-blue-200",
  LEG: "bg-green-100 text-green-800 border-green-200",
  BACK: "bg-indigo-100 text-indigo-800 border-indigo-200",
  ABS: "bg-pink-100 text-pink-800 border-pink-200",
};

export default function TrainingTemplatePage() {
  const { templates, loading, error, createTemplate, updateTemplate, deleteTemplate } =
    useTrainingTemplates();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<{
    id: number;
    name: string;
    trainingRecordTemplates: {
      trainingItemId: number;
      weight: number | null;
      repetitions: number | null;
    }[];
  } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("このテンプレートを削除しますか？")) return;
    setDeletingId(id);
    try {
      await deleteTemplate(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (template: (typeof templates)[0]) => {
    setSelectedTemplate({
      id: template.id,
      name: template.name,
      trainingRecordTemplates: template.trainingRecordTemplates.map((rt) => ({
        trainingItemId: rt.trainingItemId,
        weight: rt.weight,
        repetitions: rt.repetitions,
      })),
    });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedTemplate(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (
    input:
      | {
          name: string;
          trainingRecordTemplates: {
            trainingItemId: number;
            weight: number | null;
            repetitions: number | null;
          }[];
        }
      | {
          id: number;
          name: string;
          trainingRecordTemplates: {
            trainingItemId: number;
            weight: number | null;
            repetitions: number | null;
          }[];
        },
  ) => {
    if ("id" in input) {
      await updateTemplate(input);
    } else {
      await createTemplate(input);
    }
  };

  if (loading) {
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-2 sm:gap-4 mb-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-slate-900 leading-tight">
              トレーニング
              <br className="sm:hidden" />
              テンプレート
            </h1>
            <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm sm:text-base font-medium shadow-sm whitespace-nowrap flex-shrink-0"
            >
              <AddIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
              <span className="hidden xs:inline sm:inline">新規</span>
              <span className="hidden sm:inline">作成</span>
            </button>
          </div>
        </div>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-800 font-medium">エラー: {error}</p>
          </div>
        )}
        {!error && templates.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <ListAltIcon sx={{ fontSize: 32, color: "#2563eb" }} />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              テンプレートが登録されていません
            </h3>
            <p className="text-slate-600 mb-6">最初のテンプレートを登録しましょう</p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <AddIcon />
              テンプレートを作成
            </button>
          </div>
        )}
        {!error && templates.length > 0 && (
          <div className="space-y-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">{template.name}</h3>
                      <p className="text-sm text-slate-500">
                        {template.trainingRecordTemplates.length} 種目
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(template)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        aria-label="編集"
                      >
                        <EditIcon sx={{ fontSize: 20 }} />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        disabled={deletingId === template.id}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        aria-label="削除"
                      >
                        <DeleteIcon sx={{ fontSize: 20 }} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(() => {
                      const groupedRecords = template.trainingRecordTemplates.reduce(
                        (acc, record) => {
                          if (!acc[record.trainingItemId]) {
                            acc[record.trainingItemId] = [];
                          }
                          acc[record.trainingItemId].push(record);
                          return acc;
                        },
                        {} as Record<number, typeof template.trainingRecordTemplates>,
                      );
                      return Object.entries(groupedRecords).map(([itemIdStr, records]) => {
                        const firstRecord = records[0];
                        return (
                          <Disclosure key={itemIdStr} defaultOpen={records.length === 1}>
                            {({ open }) => (
                              <div className="bg-white rounded-lg border border-slate-300 overflow-hidden">
                                <DisclosureButton className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <FitnessCenterIcon
                                      sx={{ fontSize: 20, color: "#64748b", flexShrink: 0 }}
                                    />
                                    <span className="font-medium text-slate-900 truncate">
                                      {firstRecord.trainingItem.name}
                                    </span>
                                    <span
                                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${bodyPartColors[firstRecord.trainingItem.bodyPart] || "bg-gray-100 text-gray-800 border-gray-200"}`}
                                    >
                                      {bodyPartLabels[firstRecord.trainingItem.bodyPart] ||
                                        firstRecord.trainingItem.bodyPart}
                                    </span>
                                    {records.length > 1 && (
                                      <span className="text-xs text-gray-500">
                                        {records.length}セット
                                      </span>
                                    )}
                                  </div>
                                  {records.length > 1 && (
                                    <ExpandMoreIcon
                                      sx={{
                                        fontSize: 24,
                                        color: "#64748b",
                                        transform: open ? "rotate(180deg)" : "rotate(0deg)",
                                        transition: "transform 0.2s",
                                      }}
                                    />
                                  )}
                                </DisclosureButton>
                                {records.length === 1 ? (
                                  firstRecord.weight !== null && (
                                    <div className="px-3 pb-3">
                                      <span className="text-sm font-semibold text-slate-700">
                                        {firstRecord.weight} kg
                                      </span>
                                    </div>
                                  )
                                ) : (
                                  <DisclosurePanel className="px-3 pb-3 space-y-2 bg-slate-50">
                                    {records.map((record, idx) => (
                                      <div
                                        key={record.id}
                                        className="flex items-center justify-between p-2 bg-white rounded border border-slate-200"
                                      >
                                        <span className="text-sm text-gray-600">
                                          セット {idx + 1}
                                        </span>
                                        <div className="flex items-center gap-3">
                                          {record.weight !== null && (
                                            <span className="text-sm font-semibold text-slate-700">
                                              {record.weight} kg
                                            </span>
                                          )}
                                          {record.repetitions !== null && (
                                            <span className="text-sm text-slate-600">
                                              × {record.repetitions}回
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </DisclosurePanel>
                                )}
                              </div>
                            )}
                          </Disclosure>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            ))}
            <div className="text-center pt-4 pb-2">
              <p className="text-sm text-slate-500">
                全 <span className="font-semibold text-slate-700">{templates.length}</span> 件
              </p>
            </div>
          </div>
        )}
      </div>
      <TrainingTemplateModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTemplate(null);
        }}
        editTemplate={selectedTemplate}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
