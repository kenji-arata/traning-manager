"use client";

import { useState } from "react";
import { Button, Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  itemId: number;
  itemName: string;
  onDelete: (id: number) => Promise<void>;
};

export default function DeleteConfirmModal({ isOpen, onClose, itemId, itemName, onDelete }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);

    try {
      await onDelete(itemId);

      // 成功したらモーダルを閉じる
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <DialogTitle className="text-2xl font-bold mb-4 text-gray-900">削除の確認</DialogTitle>

          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="mb-6">
            <p className="text-gray-700 mb-2">以下のトレーニング種別を削除してもよろしいですか？</p>
            <div className="bg-gray-50 border border-gray-200 rounded p-3">
              <p className="font-semibold text-gray-900">{itemName}</p>
              <p className="text-sm text-gray-600">ID: {itemId}</p>
            </div>
            <p className="text-sm text-red-600 mt-3">※ この操作は取り消せません。</p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md data-hover:bg-gray-200 transition-colors data-disabled:opacity-50 data-disabled:cursor-not-allowed"
            >
              キャンセル
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md data-hover:bg-red-700 transition-colors data-disabled:opacity-50 data-disabled:cursor-not-allowed"
            >
              {isDeleting ? "削除中..." : "削除する"}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
