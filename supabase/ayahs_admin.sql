create extension if not exists pgcrypto;

create table if not exists public.ayahs (
  id uuid primary key default gen_random_uuid(),
  surah_number integer not null check (surah_number > 0),
  surah_name text not null,
  juz_number integer,
  ayah_number integer not null check (ayah_number > 0),
  arabic_text text not null default '',
  translation text not null default '',
  tafseer text not null default '',
  source_post_id integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (surah_number, ayah_number)
);

create index if not exists idx_ayahs_surah_ayah on public.ayahs (surah_number, ayah_number);
create index if not exists idx_ayahs_juz on public.ayahs (juz_number);

create or replace function public.set_ayahs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_ayahs_updated_at on public.ayahs;
create trigger trg_ayahs_updated_at
before update on public.ayahs
for each row execute function public.set_ayahs_updated_at();

alter table public.ayahs enable row level security;

drop policy if exists "ayahs_select_public" on public.ayahs;
create policy "ayahs_select_public"
on public.ayahs
for select
using (true);

drop policy if exists "ayahs_insert_auth" on public.ayahs;
create policy "ayahs_insert_auth"
on public.ayahs
for insert
to authenticated
with check (true);

drop policy if exists "ayahs_update_auth" on public.ayahs;
create policy "ayahs_update_auth"
on public.ayahs
for update
to authenticated
using (true)
with check (true);

drop policy if exists "ayahs_delete_auth" on public.ayahs;
create policy "ayahs_delete_auth"
on public.ayahs
for delete
to authenticated
using (true);

create table if not exists public.admin_upload_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid,
  admin_email text,
  source_type text not null,
  row_count integer not null default 0,
  summary text,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_upload_logs_created_at on public.admin_upload_logs (created_at desc);

alter table public.admin_upload_logs enable row level security;

drop policy if exists "admin_upload_logs_select_auth" on public.admin_upload_logs;
create policy "admin_upload_logs_select_auth"
on public.admin_upload_logs
for select
to authenticated
using (true);

drop policy if exists "admin_upload_logs_insert_auth" on public.admin_upload_logs;
create policy "admin_upload_logs_insert_auth"
on public.admin_upload_logs
for insert
to authenticated
with check (true);
