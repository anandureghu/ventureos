-- =============================================================================
-- VentureOS — Migration 0010: Richer financial tracking
-- Purpose, who handled it, whether it's company or personal funds, and two
-- independent statuses: settlement (with the outside party) and
-- reimbursement (paying back a person who fronted their own money).
-- =============================================================================

create type public.txn_fund_source as enum ('company', 'person');
create type public.txn_settlement_status as enum ('pending', 'completed');
create type public.txn_reimbursement_status as enum ('pending', 'resolved');

alter table public.transactions
  add column purpose text,
  add column assigned_to uuid references public.profiles(id),
  add column fund_source public.txn_fund_source not null default 'company',
  add column settlement_status public.txn_settlement_status not null default 'pending',
  add column reimbursement_status public.txn_reimbursement_status;
