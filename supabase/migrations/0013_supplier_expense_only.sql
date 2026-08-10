-- =============================================================================
-- VentureOS — Migration 0013: Supplier only on expense transactions
-- Revenue rows must not reference a supplier.
-- =============================================================================

alter table public.transactions
  add constraint transactions_supplier_expense_only
  check (supplier_id is null or type = 'expense');
