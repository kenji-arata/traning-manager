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
  Select,
  Checkbox,
} from "@headlessui/react";
import { BODY_PARTS } from "../schema/schema";
import { BODY_PART_LABELS } from "../../constants/bodyParts";
import { useBodyParts } from "../../hooks/useBodyParts";

type TrainingItem = {
  id: number;
  name: string;
  bodyPart: keyof typeof BODY_PARTS;
  secondaryBodyPartIds?: number[];
};

type CreateInput = {
  name: string;
  bodyPart: keyof typeof BODY_PARTS;
  secondaryBodyPartIds?: number[];
};

type UpdateInput = {
  id: number;
  name: string;
  bodyPart: keyof typeof BODY_PARTS;
  secondaryBodyPartIds?: number[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  editItem?: TrainingItem | null;
  onSubmit: (input: CreateInput | UpdateInput) => Promise<void>;
};

export default function TrainingItemModal({ isOpen, onClose, editItem, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [bodyPart, setBodyPart] = useState<keyof typeof BODY_PARTS>("ARM");
  const [secondaryBodyPartIds, setSecondaryBodyPartIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { bodyParts, loading: bodyPartsLoading } = useBodyParts();

  const isEditMode = !!editItem;

  // 編集モードの場合、初期値をセット
  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setBodyPart(editItem.bodyPart);
      setSecondaryBodyPartIds(editItem.secondaryBodyPartIds ?? []);
    } else {
      setName("");
      setBodyPart("ARM");
      setSecondaryBodyPartIds([]);
    }
    setError(null);
  }, [editItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const input = isEditMode
        ? { id: editItem.id, name, bodyPart, secondaryBodyPartIds }
        : { name, bodyPart, secondaryBodyPartIds };

      await onSubmit(input);

      // 成功したらフォームをリセットしてモーダルを閉じる
      setName("");
      setBodyPart("ARM");
      setSecondaryBodyPartIds([]);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `${isEditMode ? "更新" : "登録"}に失敗しました`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSecondaryBodyPartToggle = (bodyPartId: number) => {
    setSecondaryBodyPartIds((prev) =>
      prev.includes(bodyPartId) ? prev.filter((id) => id !== bodyPartId) : [...prev, bodyPartId],
    );
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <DialogTitle className="text-2xl font-bold mb-4">
            トレーニング種別の{isEditMode ? "更新" : "新規作成"}
          </DialogTitle>

          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Fieldset className="space-y-6">
              <Legend className="sr-only">トレーニング種別の情報</Legend>

              <Field>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  トレーニング名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="例: ベンチプレス"
                />
              </Field>

              <Field>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  部位 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={bodyPart}
                  onChange={(e) => setBodyPart(e.target.value as keyof typeof BODY_PARTS)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {Object.entries(BODY_PARTS).map(([key, value]) => (
                    <option key={value} value={value}>
                      {BODY_PART_LABELS[key as keyof typeof BODY_PARTS]}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  サブ部位（複数選択可）
                </Label>
                {bodyPartsLoading ? (
                  <div className="text-sm text-gray-500">読み込み中...</div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
                    {bodyParts.length === 0 ? (
                      <div className="text-sm text-gray-500">
                        サブ部位データがありません
                      </div>
                    ) : (
                      bodyParts.map((bp) => (
                        <div key={bp.id} className="flex items-center">
                          <Checkbox
                            checked={secondaryBodyPartIds.includes(bp.id)}
                            onChange={() => handleSecondaryBodyPartToggle(bp.id)}
                            className="group mr-2 size-4 rounded border border-gray-300 bg-white data-checked:bg-blue-600 data-checked:border-blue-600"
                          >
                            <svg
                              className="stroke-white opacity-0 group-data-checked:opacity-100"
                              viewBox="0 0 14 14"
                              fill="none"
                            >
                              <path
                                d="M3 8L6 11L11 3.5"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </Checkbox>
                          <Label className="text-sm text-gray-700 cursor-pointer">
                            {bp.name}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Field>
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
