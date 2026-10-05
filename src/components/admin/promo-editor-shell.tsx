"use client";

import { useState } from "react";
import type { PromoDraft } from "@/components/admin/promo-editor";
import { PromoEditor } from "@/components/admin/promo-editor";

export function PromoEditorShell({ draft }: { draft: PromoDraft | null }) {
  const [isOpen, setIsOpen] = useState(draft !== null);

  return (
    <PromoEditor
      draft={draft}
      isOpen={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
    />
  );
}