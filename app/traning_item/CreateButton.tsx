"use client";

import { useState } from "react";
import { Button } from "@headlessui/react";
import TrainingItemModal from "./TrainingItemModal";
import { BODY_PARTS } from "../schema/schema";

type Props = {
  createItem: (input: { name: string; bodyPart: keyof typeof BODY_PARTS }) => Promise<void>;
};

export default function CreateButton({ createItem }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md data-hover:bg-blue-700 transition-colors font-semibold shadow-md"
      >
        新規作成
      </Button>
      <TrainingItemModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        editItem={null}
        onSubmit={(input) => {
          if (!("id" in input)) {
            return createItem(input);
          }
          return Promise.resolve();
        }}
      />
    </>
  );
}
