"use client";

import { useState } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Field,
  Fieldset,
  Input,
  Label,
  Legend,
  Select,
} from "@headlessui/react";
import { BODY_PARTS } from "@/schema/schema";
import { useRouter } from "next/navigation";

const bodyPartLabels: Record<keyof typeof BODY_PARTS, string> = {
  ARM: "腕",
  SHOULDER: "肩",
  CHEST: "胸",
  LEG: "脚",
  BACK: "背中",
  ABS: "腹筋",
};

export default function CreateTrainingItemModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [bodyPart, setBodyPart] = useState<keyof typeof BODY_PARTS>("ARM");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/training_item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          bodyPart,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "登録に失敗しました");
      }

      // 成功したらフォームをリセットしてモーダルを閉じる
      setName("");
      setBodyPart("ARM");
      setIsOpen(false);

      // ページをリフレッシュして最新データを表示
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-semibold shadow-md"
      >
        + 新規作成
      </button>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <DialogTitle className="text-2xl font-bold mb-4">
              トレーニング種別の新規作成
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
                        {bodyPartLabels[key as keyof typeof BODY_PARTS]}
                      </option>
                    ))}
                  </Select>
                </Field>
              </Fieldset>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "登録中..." : "登録"}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
