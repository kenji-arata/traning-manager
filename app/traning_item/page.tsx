import { BODY_PARTS } from "@/schema/schema";
import CreateTrainingItemModal from "./CreateTrainingItemModal";

type TrainingItem = {
  id: number;
  name: string;
  bodyPart: keyof typeof BODY_PARTS;
  createdAt: string;
  updatedAt: string;
};

// 部位の日本語変換
const bodyPartLabels: Record<keyof typeof BODY_PARTS, string> = {
  ARM: "腕",
  SHOULDER: "肩",
  CHEST: "胸",
  LEG: "脚",
  BACK: "背中",
  ABS: "腹筋",
};

export default async function TrainingItemPage() {
  let trainingItems: TrainingItem[] = [];
  let error: string | null = null;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/training_item`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`APIエラー: ${response.status}`);
    }

    trainingItems = await response.json();
  } catch (e) {
    error = e instanceof Error ? e.message : "データの取得に失敗しました";
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">トレーニング種別一覧</h1>
        <CreateTrainingItemModal />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          エラー: {error}
        </div>
      )}

      {!error && trainingItems.length === 0 && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          トレーニング種別が登録されていません。
        </div>
      )}

      {!error && trainingItems.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 shadow-md rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">
                  ID
                </th>
                <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">
                  名前
                </th>
                <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">
                  部位
                </th>
                <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">
                  作成日時
                </th>
                <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">
                  更新日時
                </th>
              </tr>
            </thead>
            <tbody>
              {trainingItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 border-b text-sm text-gray-900">{item.id}</td>
                  <td className="px-6 py-4 border-b text-sm text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 border-b text-sm text-gray-900">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {bodyPartLabels[item.bodyPart]}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b text-sm text-gray-600">
                    {new Date(item.createdAt).toLocaleString("ja-JP")}
                  </td>
                  <td className="px-6 py-4 border-b text-sm text-gray-600">
                    {new Date(item.updatedAt).toLocaleString("ja-JP")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">全 {trainingItems.length} 件</div>
    </div>
  );
}
