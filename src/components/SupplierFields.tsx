"use client";

import type { SupplierDraft } from "@/lib/types";

export const EMPTY_SUPPLIER_DRAFT: SupplierDraft = {
  name: "",
  contact_name: "",
  email: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  region: "",
  postal_code: "",
  country: "",
  notes: ""
};

/** Map a draft to nullable DB columns; returns null if name is empty. */
export function supplierPayloadFromDraft(draft: SupplierDraft) {
  const name = draft.name.trim();
  if (!name) return null;
  const opt = (v: string) => {
    const t = v.trim();
    return t || null;
  };
  return {
    name,
    contact_name: opt(draft.contact_name),
    email: opt(draft.email),
    phone: opt(draft.phone),
    address_line1: opt(draft.address_line1),
    address_line2: opt(draft.address_line2),
    city: opt(draft.city),
    region: opt(draft.region),
    postal_code: opt(draft.postal_code),
    country: opt(draft.country),
    notes: opt(draft.notes)
  };
}

/**
 * Reusable supplier form fields. Only name is required; contact + address
 * are optional. Use inside transaction dialogs or a dedicated suppliers UI.
 */
export default function SupplierFields({
  value,
  onChange,
  idPrefix = "supplier",
  autoFocusName = false
}: {
  value: SupplierDraft;
  onChange: (next: SupplierDraft) => void;
  idPrefix?: string;
  autoFocusName?: boolean;
}) {
  function set<K extends keyof SupplierDraft>(key: K, v: SupplierDraft[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-sm text-fg-muted" htmlFor={`${idPrefix}-name`}>
          Supplier name <span className="text-signal-red">*</span>
        </label>
        <input
          id={`${idPrefix}-name`}
          className="field"
          placeholder="Company or person"
          value={value.name}
          onChange={(e) => set("name", e.target.value)}
          autoFocus={autoFocusName}
          required
        />
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-fg-faint">Contact</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm text-fg-muted" htmlFor={`${idPrefix}-contact`}>
              Contact name
            </label>
            <input
              id={`${idPrefix}-contact`}
              className="field"
              placeholder="Optional"
              value={value.contact_name}
              onChange={(e) => set("contact_name", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-fg-muted" htmlFor={`${idPrefix}-email`}>
              Email
            </label>
            <input
              id={`${idPrefix}-email`}
              className="field"
              type="email"
              placeholder="Optional"
              value={value.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-fg-muted" htmlFor={`${idPrefix}-phone`}>
              Phone
            </label>
            <input
              id={`${idPrefix}-phone`}
              className="field"
              type="tel"
              placeholder="Optional"
              value={value.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-fg-faint">Address</p>
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm text-fg-muted" htmlFor={`${idPrefix}-line1`}>
              Address line 1
            </label>
            <input
              id={`${idPrefix}-line1`}
              className="field"
              placeholder="Optional"
              value={value.address_line1}
              onChange={(e) => set("address_line1", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-fg-muted" htmlFor={`${idPrefix}-line2`}>
              Address line 2
            </label>
            <input
              id={`${idPrefix}-line2`}
              className="field"
              placeholder="Optional"
              value={value.address_line2}
              onChange={(e) => set("address_line2", e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm text-fg-muted" htmlFor={`${idPrefix}-city`}>
                City
              </label>
              <input
                id={`${idPrefix}-city`}
                className="field"
                placeholder="Optional"
                value={value.city}
                onChange={(e) => set("city", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-fg-muted" htmlFor={`${idPrefix}-region`}>
                State / region
              </label>
              <input
                id={`${idPrefix}-region`}
                className="field"
                placeholder="Optional"
                value={value.region}
                onChange={(e) => set("region", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-fg-muted" htmlFor={`${idPrefix}-postal`}>
                Postal code
              </label>
              <input
                id={`${idPrefix}-postal`}
                className="field"
                placeholder="Optional"
                value={value.postal_code}
                onChange={(e) => set("postal_code", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-fg-muted" htmlFor={`${idPrefix}-country`}>
                Country
              </label>
              <input
                id={`${idPrefix}-country`}
                className="field"
                placeholder="Optional"
                value={value.country}
                onChange={(e) => set("country", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
