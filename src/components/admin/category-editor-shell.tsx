"use client";

import { useState } from "react";
import { CategoryEditor, type CategoryDraft } from "@/components/admin/category-editor";

/**
 * The page reads the edit target from the URL, so this wrapper owns just the
 * open/closed state of the editor and hands the draft down.
 */
export function CategoryEditorShell({ draft }: { draft: CategoryDraft | null }) {
  const [isOpen, setIsOpen] = useState(draft !== null);

  return (
    <CategoryEditor
      draft={draft}
      isOpen={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
    />
  );
}