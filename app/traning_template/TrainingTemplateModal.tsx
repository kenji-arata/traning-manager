"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogPanel,
  DialogTitle,
  Field,
  Fieldset,
  Input,
  Label,
  Legend,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  FitnessCenter as FitnessCenterIcon,
} from "@mui/icons-material";
import { useTrainingItems } from "../../hooks/useTrainingItems";

type TrainingRecordTemplateInput = {
  trainingItemId: number;
  weight: number | null;
  repetitions: number | null;
};

type TemplateInput = {
  name: string;
  trainingRecordTemplates: TrainingRecordTemplateInput[];
};

type TemplateInputWithId = TemplateInput & { id: number };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  editTemplate?: {
    id: number;
    name: string;
    trainingRecordTemplates: {
      trainingItemId: number;
      weight: number | null;
      repetitions: number | null;
    }[];
  } | null;
  onSubmit: (input: TemplateInput | TemplateInputWithId) => Promise<void>;
};

export default function TrainingTemplateModal({ isOpen, onClose, editTemplate, onSubmit }: Props) {
  const { items: trainingItems } = useTrainingItems();
  const [name, setName] = useState("");
  const [recordTemplates, setRecordTemplates] = useState<TrainingRecordTemplateInput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditMode = !!editTemplate;

  useEffect(() => {
    if (editTemplate) {
      setName(editTemplate.name);
      setRecordTemplates(editTemplate.trainingRecordTemplates);
    } else {
      setName("");
      setRecordTemplates([]);
    }
    setError(null);
  }, [editTemplate, isOpen]);

  const handleAddItem = () => {
    if (trainingItems.length === 0) return;
    setRecordTemplates([
      ...recordTemplates,
      { trainingItemId: trainingItems[0].id, weight: null, repetitions: null },
    ]);
  };

  const handleAddItemToGroup = (trainingItemId: number) => {
    setRecordTemplates([...recordTemplates, { trainingItemId, weight: null, repetitions: null }]);
  };

  const handleRemoveItem = (index: number) => {
    setRecordTemplates(recordTemplates.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof TrainingRecordTemplateInput,
    value: number | null,
  ) => {
    const updated = [...recordTemplates];
    updated[index] = { ...updated[index], [field]: value };
    setRecordTemplates(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (recordTemplates.length === 0) {
      setError("少なくとも1つのトレーニング種目を追加してください");
      return;
    }
    setIsSubmitting(true);
    try {
      const input: TemplateInput = { name, trainingRecordTemplates: recordTemplates };
      if (isEditMode) {
        await onSubmit({ ...input, id: editTemplate.id });
      } else {
        await onSubmit(input);
        setName("");
        setRecordTemplates([]);
        onClose();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `${isEditMode ? "更新" : "登録"}に失敗しました`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupedRecords = recordTemplates.reduce(
    (acc, record, index) => {
      if (!acc[record.trainingItemId]) {
        acc[record.trainingItemId] = [];
      }
      acc[record.trainingItemId].push({ ...record, originalIndex: index });
      return acc;
    },
    {} as Record<number, Array<TrainingRecordTemplateInput & { originalIndex: number }>>,
  );

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="text-2xl font-bold mb-4">
            テンプレートの{isEditMode ? "更新" : "新規作成"}
          </DialogTitle>
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <Fieldset className="space-y-6">
              <Legend className="sr-only">テンプレートの情報</Legend>
              <Field>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  テンプレート名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="例: 胸トレーニング"
                />
              </Field>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="block text-sm font-medium text-gray-700">
                    トレーニング種目 <span className="text-red-500">*</span>
                  </Label>
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    disabled={trainingItems.length === 0}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md data-hover:bg-blue-700 transition-colors data-disabled:opacity-50 data-disabled:cursor-not-allowed"
                  >
                    <AddIcon sx={{ fontSize: 16 }} />
                    種目を追加
                  </Button>
                </div>
                {trainingItems.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">トレーニング種目が登録されていません</p>
                  </div>
                ) : recordTemplates.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">
                      「種目を追加」ボタンからトレーニング種目を追加してください
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(groupedRecords).map(([itemIdStr, records]) => {
                      const itemId = parseInt(itemIdStr);
                      const item = trainingItems.find((i) => i.id === itemId);
                      if (!item) return null;
                      return (
                        <Disclosure key={itemId} defaultOpen>
                          {({ open }) => (
                            <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                              <div className="flex items-center justify-between p-4 gap-3">
                                <DisclosureButton className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity">
                                  <FitnessCenterIcon sx={{ fontSize: 20, color: "#64748b" }} />
                                  <span className="font-medium text-slate-900">{item.name}</span>
                                  <span className="text-xs text-gray-500">
                                    {records.length}セット
                                  </span>
                                  <ExpandMoreIcon
                                    sx={{
                                      fontSize: 24,
                                      color: "#64748b",
                                      transform: open ? "rotate(180deg)" : "rotate(0deg)",
                                      transition: "transform 0.2s",
                                    }}
                                  />
                                </DisclosureButton>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddItemToGroup(itemId);
                                  }}
                                  className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors flex-shrink-0"
                                >
                                  <AddIcon sx={{ fontSize: 16 }} />
                                </button>
                              </div>
                              <DisclosurePanel className="p-4 pt-0 space-y-2 bg-gray-50">
                                {records.map((record, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200"
                                  >
                                    <span className="text-sm font-medium text-gray-600 flex-shrink-0">
                                      セット {idx + 1}
                                    </span>
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                      <Field>
                                        <Label className="sr-only">重量 (kg)</Label>
                                        <Input
                                          type="number"
                                          step="0.1"
                                          value={record.weight ?? ""}
                                          onChange={(e) =>
                                            handleItemChange(
                                              record.originalIndex,
                                              "weight",
                                              e.target.value ? parseFloat(e.target.value) : null,
                                            )
                                          }
                                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          placeholder="重量 (kg)"
                                        />
                                      </Field>
                                      <Field>
                                        <Label className="sr-only">回数</Label>
                                        <Input
                                          type="number"
                                          value={record.repetitions ?? ""}
                                          onChange={(e) =>
                                            handleItemChange(
                                              record.originalIndex,
                                              "repetitions",
                                              e.target.value ? parseInt(e.target.value) : null,
                                            )
                                          }
                                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          placeholder="回数"
                                        />
                                      </Field>
                                    </div>
                                    <Button
                                      type="button"
                                      onClick={() => handleRemoveItem(record.originalIndex)}
                                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                    >
                                      <DeleteIcon sx={{ fontSize: 20 }} />
                                    </Button>
                                  </div>
                                ))}
                              </DisclosurePanel>
                            </div>
                          )}
                        </Disclosure>
                      );
                    })}
                  </div>
                )}
              </div>
            </Fieldset>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md data-hover:bg-gray-200 transition-colors data-disabled:opacity-50 data-disabled:cursor-not-allowed"
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md data-hover:bg-blue-700 transition-colors data-disabled:opacity-50 data-disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? `${isEditMode ? "更新" : "登録"}中...`
                  : isEditMode
                    ? "更新"
                    : "登録"}
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
