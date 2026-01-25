"use client";

import { useState } from "react";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import {
  GridView as GridViewIcon,
  FitnessCenter as FitnessCenterIcon,
  SelfImprovement as SelfImprovementIcon,
  FavoriteBorder as FavoriteBorderIcon,
  DirectionsRun as DirectionsRunIcon,
  Accessibility as AccessibilityIcon,
  Whatshot as WhatshotIcon,
  LabelOutlined as LabelOutlinedIcon,
  AccessTime as AccessTimeIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useTrainingItems, type TrainingItem } from "../../hooks/useTrainingItems";
import { useBodyParts } from "../../hooks/useBodyParts";
import CreateButton from "./CreateButton";
import TrainingItemModal from "./TrainingItemModal";
import DeleteConfirmModal from "./DeleteConfirmModal";

export default function TrainingItemPage() {
  const { items, loading, error, createItem, updateItem, deleteItem } = useTrainingItems();
  const { bodyParts } = useBodyParts();
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TrainingItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<TrainingItem | null>(null);

  // bodyPartMasterIdからボディパート名を取得
  const getBodyPartName = (bodyPartMasterId: number): string => {
    const bodyPart = bodyParts.find((bp) => bp.id === bodyPartMasterId);
    return bodyPart?.name ?? "不明";
  };

  // タブの定義を動的に生成
  const tabs = [
    { key: "ALL", label: "全て", Icon: GridViewIcon },
    ...bodyParts.map((bp) => ({
      key: bp.id.toString(),
      label: bp.name,
      Icon: FitnessCenterIcon, // デフォルトアイコン
    })),
  ];

  const filterByBodyPart = (tabKey: string): TrainingItem[] => {
    if (tabKey === "ALL") {
      return items;
    }
    const bodyPartId = parseInt(tabKey, 10);
    return items.filter((item) => item.bodyPartMasterId === bodyPartId);
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
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 mb-2 flex-nowrap">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 whitespace-nowrap">
              トレーニング種別
            </h1>
            <CreateButton createItem={createItem} />
          </div>
        </div>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-800 font-medium">エラー: {error}</p>
          </div>
        )}
        {!error && items.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <span className="text-3xl">🏃</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              トレーニング種別が登録されていません
            </h3>
            <p className="text-slate-600 mb-6">最初のトレーニング種別を登録しましょう</p>
          </div>
        )}
        {!error && items.length > 0 && (
          <TabGroup selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex}>
            <TabList className="flex gap-2 overflow-x-auto pb-2 mb-6">
              {tabs.map((tab) => {
                const IconComponent = tab.Icon;
                const filteredCount =
                  tab.key === "ALL" ? items.length : filterByBodyPart(tab.key).length;
                return (
                  <Tab
                    key={tab.key}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg
                      whitespace-nowrap transition-all duration-200
                      text-slate-700 bg-white border border-slate-200
                      data-selected:bg-blue-600 data-selected:text-white data-selected:border-blue-600 data-selected:shadow-lg data-selected:shadow-blue-600/25
                      data-hover:bg-slate-50 data-hover:border-slate-300
                      data-selected:data-hover:bg-blue-700
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <IconComponent sx={{ fontSize: 20 }} />
                    <span>{tab.label}</span>
                    <span className="data-selected:bg-blue-500 data-selected:text-white bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                      {filteredCount}
                    </span>
                  </Tab>
                );
              })}
            </TabList>
            <TabPanels>
              {tabs.map((tab) => {
                const filteredItems = filterByBodyPart(tab.key);
                const IconComponent = tab.Icon;
                return (
                  <TabPanel key={tab.key} className="focus:outline-none">
                    {filteredItems.length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                        <IconComponent sx={{ fontSize: 64, color: "#94a3b8", mb: 2 }} />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">
                          {tab.label}のトレーニングはまだありません
                        </h3>
                        <p className="text-slate-600">新しいトレーニング種別を追加しましょう</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredItems.map((item, index) => (
                          <div
                            key={item.id}
                            className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className="p-5">
                              <div className="flex items-start justify-between gap-4">
                                <div
                                  className="flex-1 min-w-0 cursor-pointer"
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setIsEditModalOpen(true);
                                  }}
                                >
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold text-slate-900 truncate">
                                      {item.name}
                                    </h3>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border bg-blue-100 text-blue-800 border-blue-200">
                                      {getBodyPartName(item.bodyPartMasterId)}
                                    </span>
                                  </div>
                                  {item.secondaryBodyPartIds &&
                                    item.secondaryBodyPartIds.length > 0 && (
                                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className="text-xs text-slate-600">サブ部位:</span>
                                        {item.secondaryBodyPartIds.map((bodyPartId) => (
                                          <span
                                            key={bodyPartId}
                                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                                          >
                                            {getBodyPartName(bodyPartId)}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  <div className="flex items-center gap-4 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                      <LabelOutlinedIcon sx={{ fontSize: 16 }} />
                                      ID: {item.id}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <AccessTimeIcon sx={{ fontSize: 16 }} />
                                      {new Date(item.updatedAt).toLocaleDateString("ja-JP", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex-shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setItemToDelete(item);
                                      setIsDeleteModalOpen(true);
                                    }}
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
                        <div className="text-center pt-4 pb-2">
                          <p className="text-sm text-slate-500">
                            全{" "}
                            <span className="font-semibold text-slate-700">
                              {filteredItems.length}
                            </span>{" "}
                            件
                          </p>
                        </div>
                      </div>
                    )}
                  </TabPanel>
                );
              })}
            </TabPanels>
          </TabGroup>
        )}
      </div>
      <TrainingItemModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedItem(null);
        }}
        editItem={selectedItem}
        onSubmit={(input) => {
          if ("id" in input) {
            return updateItem(input);
          }
          return Promise.resolve();
        }}
      />
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        itemId={itemToDelete?.id ?? 0}
        itemName={itemToDelete?.name ?? ""}
        onDelete={deleteItem}
      />
    </div>
  );
}
