-- ============================================================
-- Pinnacle Injury Consultants — Supabase Schema
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── ENUMS ───────────────────────────────────────────────────
create type user_role as enum ('admin', 'specialist', 'lawyer', 'client');
create type case_status as enum ('lead', 'intake', 'sent_to_attorney', 'accepted', 'rejected', 'signed', 'settled', 'closed');
create type case_type as enum ('auto_accident', 'slip_and_fall', 'workplace_injury', 'medical_malpractice', 'other');
create type notification_channel as enum ('email', 'sms', 'both');

-- ── PROFILES ─────────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role user_role not null default 'client',
  phone text,
  firm_name text,
  avatar_url text,
  notification_channel notification_channel not null default 'email',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select using (auth.uid() = id);

create policy "Admins and specialists can view all profiles"
  on profiles for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'specialist', 'lawyer'))
  );

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

create policy "Admins can update any profile"
  on profiles for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Service role can insert profiles"
  on profiles for insert with check (true);

-- ── CASES ────────────────────────────────────────────────────
create table cases (
  id uuid primary key default uuid_generate_v4(),
  case_number text not null unique,
  client_id uuid not null references profiles(id) on delete restrict,
  assigned_specialist_id uuid references profiles(id) on delete set null,
  assigned_lawyer_id uuid references profiles(id) on delete set null,
  status case_status not null default 'lead',
  case_type case_type not null default 'auto_accident',
  incident_date date,
  description text,
  accident_location text,
  injuries text,
  medical_provider text,
  police_report_number text,
  insurance_claim_number text,
  estimated_value numeric(12,2),
  settlement_amount numeric(12,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table cases enable row level security;

create policy "Clients see only their own cases"
  on cases for select using (
    auth.uid() = client_id
  );

create policy "Internal staff see all cases"
  on cases for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'specialist'))
  );

create policy "Lawyers see their assigned cases"
  on cases for select using (
    auth.uid() = assigned_lawyer_id
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'specialist'))
  );

create policy "Admin and specialists can insert cases"
  on cases for insert with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'specialist'))
  );

create policy "Admin and specialists can update cases"
  on cases for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'specialist'))
  );

-- ── CASE NOTES ───────────────────────────────────────────────
create table case_notes (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid not null references cases(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete restrict,
  content text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

alter table case_notes enable row level security;

create policy "Internal users see all notes"
  on case_notes for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'specialist', 'lawyer'))
  );

create policy "Clients see only non-internal notes on their cases"
  on case_notes for select using (
    is_internal = false
    and exists (select 1 from cases c where c.id = case_id and c.client_id = auth.uid())
  );

create policy "Staff can add notes"
  on case_notes for insert with check (
    auth.uid() = author_id
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'specialist', 'lawyer'))
  );

-- ── NOTIFICATIONS LOG ─────────────────────────────────────────
create table notifications_log (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid references cases(id) on delete set null,
  recipient_id uuid not null references profiles(id) on delete cascade,
  channel text not null check (channel in ('email', 'sms')),
  subject text,
  body text not null,
  status text not null check (status in ('sent', 'failed')),
  sent_at timestamptz not null default now()
);

alter table notifications_log enable row level security;

create policy "Admins can see notification logs"
  on notifications_log for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Service role can insert notification logs"
  on notifications_log for insert with check (true);

-- ── INVITATIONS ───────────────────────────────────────────────
create table invitations (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  role user_role not null,
  invited_by uuid not null references profiles(id) on delete restrict,
  token text not null unique,
  accepted boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table invitations enable row level security;

create policy "Admins can manage invitations"
  on invitations for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Service role can insert and update invitations"
  on invitations for all with check (true);

-- ── UPDATED_AT TRIGGER ────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on profiles
  for each row execute function update_updated_at();

create trigger cases_updated_at before update on cases
  for each row execute function update_updated_at();

-- ── FIRST ADMIN USER ─────────────────────────────────────────
-- After creating your Supabase auth user manually,
-- insert your admin profile here:
--
-- insert into profiles (id, email, full_name, role, is_active)
-- values ('YOUR-AUTH-USER-UUID', 'your@email.com', 'Your Name', 'admin', true);
