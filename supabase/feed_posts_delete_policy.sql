alter table public.feed_posts enable row level security;

drop policy if exists "feed_posts_delete" on public.feed_posts;
create policy "feed_posts_delete"
on public.feed_posts
for delete
using (true);
