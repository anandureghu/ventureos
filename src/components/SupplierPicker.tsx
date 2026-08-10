"use client";

import SupplierFields, {
  EMPTY_SUPPLIER_DRAFT
} from "@/components/SupplierFields";
import type { Supplier, SupplierDraft } from "@/lib/types";

const NEW_VALUE = "__new__";

/**
 * Optional supplier dropdown: pick an existing workspace supplier, leave empty,
 * or expand reusable supplier fields to create one (only name required).
 */
export default function SupplierPicker({
  suppliers,
  supplierId,
  onSupplierIdChange,
  creating,
  onCreatingChange,
  draft,
  onDraftChange
}: {
  suppliers: Supplier[];
  /** Selected supplier id, or "" for none. */
  supplierId: string;
  onSupplierIdChange: (id: string) => void;
  creating: boolean;
  onCreatingChange: (creating: boolean) => void;
  draft: SupplierDraft;
  onDraftChange: (draft: SupplierDraft) => void;
}) {
  const selectValue = creating ? NEW_VALUE : supplierId;

  function handleSelect(value: string) {
    if (value === NEW_VALUE) {
      onSupplierIdChange("");
      onDraftChange(EMPTY_SUPPLIER_DRAFT);
      onCreatingChange(true);
      return;
    }
    onCreatingChange(false);
    onSupplierIdChange(value);
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-sm text-fg-muted">Supplier</label>
        <select
          className="field"
          value={selectValue}
          onChange={(e) => handleSelect(e.target.value)}
        >
          <option value="">None</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
          <option value={NEW_VALUE}>+ Add supplier…</option>
        </select>
      </div>

      {creating && (
        <div className="rounded-lg border border-ink-500 bg-ink-800/40 p-3">
          <SupplierFields
            value={draft}
            onChange={onDraftChange}
            idPrefix="txn-supplier"
            autoFocusName
          />
        </div>
      )}
    </div>
  );
}
