-- =============================================================================
-- VentureOS — Migration 0012: Suppliers + transaction attachments
-- Workspace-scoped suppliers (name required; contact/address optional).
-- Transactions may optionally reference a supplier. Documents may optionally
-- attach to a transaction (receipts / invoices).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- suppliers  (reusable across ventures in a workspace)
-- -----------------------------------------------------------------------------
create table public.suppliers (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  name          text not null,
  contact_name  text,
  email         text,
  phone         text,
  address_line1 text,
  address_line2 text,
  city          text,
  region        text,
  postal_code   text,
  country       text,
  notes         text,
  created_by    uuid not null references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index suppliers_org_idx on public.suppliers(org_id);
create index suppliers_org_name_idx on public.suppliers(org_id, lower(name));

create trigger suppliers_set_updated_at
  before update on public.suppliers
  for each row execute function public.set_updated_at();

alter table public.suppliers enable row level security;

create policy "suppliers: members read"
  on public.suppliers for select
  using (public.is_org_member(org_id));

create policy "suppliers: members create"
  on public.suppliers for insert
  with check (public.is_org_member(org_id) and created_by = auth.uid());

create policy "suppliers: members update"
  on public.suppliers for update
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy "suppliers: members delete"
  on public.suppliers for delete
  using (public.is_org_member(org_id));

-- -----------------------------------------------------------------------------
-- transactions.supplier_id (optional)
-- -----------------------------------------------------------------------------
alter table public.transactions
  add column supplier_id uuid references public.suppliers(id) on delete set null;

create index transactions_supplier_idx on public.transactions(supplier_id);

-- -----------------------------------------------------------------------------
-- documents.transaction_id (optional attachment to a financial record)
-- -----------------------------------------------------------------------------
alter table public.documents
  add column transaction_id uuid references public.transactions(id) on delete cascade;

create index documents_transaction_idx on public.documents(transaction_id);
