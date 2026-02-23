# Ruju Quran (Expo)

A dark-themed Quran reading app with Quran reader + community feed.

## Features

- Surah list with search
- Reader per surah with ayah search
- Bookmarks (saved locally with AsyncStorage)
- Last-read resume tracking
- Splash screen + first-time display name setup
- Community feed (1:1 square text posts, likes, comments)
- Supabase-backed feed storage (posts, likes, comments)
- Supabase-backed Quran ayah sync with local JSON fallback

## Run App

```bash
npm install
npm run start
```

## Feed Backend (Supabase)

Yes, for production you should store feed posts/likes/comments in a database.
This app uses Supabase for that.

Use `.env` (already supported via `app.config.js`):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Notes:
- `EXPO_PUBLIC_*` values are safe for client use (anon key).
- `SUPABASE_SERVICE_ROLE_KEY` must never be used inside the app client; keep it only for backend/admin scripts.

### Required Tables (run in Supabase SQL editor)

```sql
create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_device_id text,
  content text not null check (char_length(content) <= 300),
  created_at timestamptz not null default now()
);

alter table public.feed_posts
  add column if not exists author_device_id text;

create table if not exists public.feed_likes (
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  device_id text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, device_id)
);

create table if not exists public.feed_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  author_name text not null,
  content text not null check (char_length(content) <= 300),
  created_at timestamptz not null default now()
);

create table if not exists public.feed_comment_likes (
  comment_id uuid not null references public.feed_comments(id) on delete cascade,
  device_id text not null,
  created_at timestamptz not null default now(),
  primary key (comment_id, device_id)
);

create table if not exists public.feed_comment_replies (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.feed_comments(id) on delete cascade,
  author_name text not null,
  content text not null check (char_length(content) <= 300),
  created_at timestamptz not null default now()
);

alter table public.feed_posts enable row level security;
alter table public.feed_likes enable row level security;
alter table public.feed_comments enable row level security;
alter table public.feed_comment_likes enable row level security;
alter table public.feed_comment_replies enable row level security;

drop policy if exists "feed_posts_select" on public.feed_posts;
drop policy if exists "feed_posts_insert" on public.feed_posts;
drop policy if exists "feed_posts_delete" on public.feed_posts;
create policy "feed_posts_select" on public.feed_posts for select using (true);
create policy "feed_posts_insert" on public.feed_posts for insert with check (true);
create policy "feed_posts_delete" on public.feed_posts for delete using (true);

drop policy if exists "feed_likes_select" on public.feed_likes;
drop policy if exists "feed_likes_insert" on public.feed_likes;
drop policy if exists "feed_likes_delete" on public.feed_likes;
create policy "feed_likes_select" on public.feed_likes for select using (true);
create policy "feed_likes_insert" on public.feed_likes for insert with check (true);
create policy "feed_likes_delete" on public.feed_likes for delete using (true);

drop policy if exists "feed_comments_select" on public.feed_comments;
drop policy if exists "feed_comments_insert" on public.feed_comments;
create policy "feed_comments_select" on public.feed_comments for select using (true);
create policy "feed_comments_insert" on public.feed_comments for insert with check (true);

drop policy if exists "feed_comment_likes_select" on public.feed_comment_likes;
drop policy if exists "feed_comment_likes_insert" on public.feed_comment_likes;
drop policy if exists "feed_comment_likes_delete" on public.feed_comment_likes;
create policy "feed_comment_likes_select" on public.feed_comment_likes for select using (true);
create policy "feed_comment_likes_insert" on public.feed_comment_likes for insert with check (true);
create policy "feed_comment_likes_delete" on public.feed_comment_likes for delete using (true);

drop policy if exists "feed_comment_replies_select" on public.feed_comment_replies;
drop policy if exists "feed_comment_replies_insert" on public.feed_comment_replies;
create policy "feed_comment_replies_select" on public.feed_comment_replies for select using (true);
create policy "feed_comment_replies_insert" on public.feed_comment_replies for insert with check (true);
```

## Quran Ayahs Backend (Supabase)

Run SQL file:

```bash
supabase/ayahs_admin.sql
```

This creates:
- `public.ayahs` table (unique by `surah_number + ayah_number`)
- indexes + `updated_at` trigger
- read policy for app users
- write policies for authenticated admin users

## Admin Panel (Web)

Folder: `ruju-admin-panel/`

Purpose:
- Paste full Telegram post text and auto-parse into ayah rows
- Quality checks before upload (missing arabic/translation/tafseer, duplicates, invalid keys)
- Import full JSON file and upsert in one step
- Manual single-ayah add/update form
- Upsert directly to `public.ayahs`
- Upload history log (who uploaded, source type, row count, summary)

How to run:

```bash
npm run admin:install
npm run admin:dev
```

Open:

```text
http://localhost:5174
```

Use:
1. Enter Supabase URL + anon key
2. Sign in with an admin email/password (Supabase Auth user)
3. Paste Telegram post and click `Parse`
4. Review quality summary + preview and click `Upsert Parsed Ayahs`
5. Or import a JSON file (`array` or `{ "rows": [...] }`) and click `Import JSON to Supabase`
6. Check upload history section for audit trail

The mobile app automatically fetches ayahs from Supabase and merges with local `ayahs_formatted.json`.

## Data Shape (Quran)

The app consumes `ayahs_formatted.json` rows like:

```json
{
  "surah_number": 2,
  "surah_name": "Al-Baqarah",
  "juz_number": 1,
  "ayah_number": 100,
  "arabic_text": "...",
  "translation": "...",
  "tafseer": "...",
  "source_post_id": 45
}
```

## Admin Sync Pipeline

Use this command to parse `result.json`, normalize ayahs, and generate a validation report:

```bash
npm run sync:data
```

Equivalent direct command:

```bash
python scripts/admin_sync.py --input result.json --output ayahs_formatted.json --report scripts/sync_report.json
```
