"use client";

import { useState } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import TrainingItemModal from "./TrainingItemModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
type Props = {
  item: {
    id: number;
    name: string;
    bodyPartMasterId: number;
    secondaryBodyPartIds?: number[];
  };
  updateItem: (input: {
    id: number;
    name: string;
    bodyPartMasterId: number;
    secondaryBodyPartIds?: number[];
  }) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
};

export default function ActionMenu({ item, updateItem, deleteItem }: Props) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return (
    <>
      <Menu>
        <MenuButton className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded data-hover:bg-gray-50 data-active:bg-gray-100 transition-colors">
          編集
        </MenuButton>
        <MenuItems
          anchor="bottom end"
          className="w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 mt-1 focus:outline-none"
        >
          <MenuItem>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 data-focus:bg-blue-50 data-focus:text-blue-600 flex items-center gap-2"
            >
              <EditIcon sx={{ fontSize: 18 }} />
              更新
            </button>
          </MenuItem>
          <MenuItem>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 data-focus:bg-red-50 data-focus:text-red-600 flex items-center gap-2"
            >
              <DeleteIcon sx={{ fontSize: 18 }} />
              削除
            </button>
          </MenuItem>
        </MenuItems>
      </Menu>

      <TrainingItemModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editItem={item}
        onSubmit={(input) => {
          if ("id" in input) {
            return updateItem(input);
          }
          return Promise.resolve();
        }}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        itemId={item.id}
        itemName={item.name}
        onDelete={deleteItem}
      />
    </>
  );
}
