"use client";

import type { Supplier } from "@/lib/types";

/** Optional supplier dropdown for expense transactions — select only. */
export default function SupplierPicker({
  suppliers,
  supplierId,
  onSupplierIdChange
}: {
  suppliers: Supplier[];
  /** Selected supplier id, or "" for none. */
  supplierId: string;
  onSupplierIdChange: (id: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-fg-muted">Supplier</label>
      <select
        className="field"
        value={supplierId}
        onChange={(e) => onSupplierIdChange(e.target.value)}
      >
        <option value="">None</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      {suppliers.length === 0 && (
        <p className="mt-1 text-[11px] text-fg-faint">
          Optional — add suppliers in the Suppliers tab first.
        </p>
      )}
    </div>
  );
}
