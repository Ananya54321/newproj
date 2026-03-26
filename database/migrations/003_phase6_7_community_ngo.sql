-- ============================================================
-- FUREVER - Phase 6 (Community) + Phase 7 (NGO) Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- ─── Phase 6: Community ──────────────────────────────────────────────────────

-- Communities (subreddit-like groups)
create table if not exists public.communities (
  id           uuid        primary key default uuid_generate_v4(),
  name         text        not null,
  slug         text        not null unique,
  description  text,
  icon_url     text,
  banner_url   text,
  created_by   uuid        references public.profiles(id) on delete set null,
  is_public    boolean     not null default true,
  member_count int         not null default 0,
  post_count   int         not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists communities_slug_idx on public.communities(slug);

create trigger trg_communities_updated_at
  before update on public.communities
  for each row execute procedure public.set_updated_at();

-- Community memberships
create table if not exists public.community_members (
  id           uuid        primary key default uuid_generate_v4(),
  community_id uuid        not null references public.communities(id) on delete cascade,
  user_id      uuid        not null references public.profiles(id) on delete cascade,
  role         text        not null default 'member' check (role in ('member', 'moderator')),
  joined_at    timestamptz not null default now(),
  unique(community_id, user_id)
);

create index if not exists community_members_user_idx   on public.community_members(user_id);
create index if not exists community_members_comm_idx   on public.community_members(community_id);

-- Maintain member_count on communities
create or replace function public.update_community_member_count()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    update public.communities set member_count = member_count + 1 where id = new.community_id;
  elsif tg_op = 'DELETE' then
    update public.communities set member_count = greatest(0, member_count - 1) where id = old.community_id;
  end if;
  return null;
end;
$$;

create trigger trg_community_member_count
  after insert or delete on public.community_members
  for each row execute procedure public.update_community_member_count();

-- Posts
create table if not exists public.posts (
  id            uuid        primary key default uuid_generate_v4(),
  community_id  uuid        not null references public.communities(id) on delete cascade,
  author_id     uuid        not null references public.profiles(id) on delete cascade,
  title         text        not null,
  content       text,
  type          text        not null default 'text' check (type in ('text', 'image', 'link')),
  image_urls    text[]      not null default '{}',
  link_url      text,
  vote_score    int         not null default 0,
  comment_count int         not null default 0,
  is_pinned     boolean     not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists posts_community_idx  on public.posts(community_id);
create index if not exists posts_author_idx     on public.posts(author_id);
create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists posts_vote_score_idx on public.posts(vote_score desc);

create trigger trg_posts_updated_at
  before update on public.posts
  for each row execute procedure public.set_updated_at();

-- Maintain post_count on communities
create or replace function public.update_community_post_count()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    update public.communities set post_count = post_count + 1 where id = new.community_id;
  elsif tg_op = 'DELETE' then
    update public.communities set post_count = greatest(0, post_count - 1) where id = old.community_id;
  end if;
  return null;
end;
$$;

create trigger trg_community_post_count
  after insert or delete on public.posts
  for each row execute procedure public.update_community_post_count();

-- Post votes (upvote = 1, downvote = -1)
create table if not exists public.post_votes (
  id         uuid      primary key default uuid_generate_v4(),
  post_id    uuid      not null references public.posts(id) on delete cascade,
  user_id    uuid      not null references public.profiles(id) on delete cascade,
  vote       smallint  not null check (vote in (1, -1)),
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

create index if not exists post_votes_post_idx on public.post_votes(post_id);

-- Maintain vote_score on posts
create or replace function public.update_post_vote_score()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set vote_score = vote_score + new.vote where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set vote_score = vote_score - old.vote where id = old.post_id;
  elsif tg_op = 'UPDATE' then
    update public.posts set vote_score = vote_score - old.vote + new.vote where id = new.post_id;
  end if;
  return null;
end;
$$;

create trigger trg_post_vote_score
  after insert or delete or update on public.post_votes
  for each row execute procedure public.update_post_vote_score();

-- Comments (supports threading via parent_id)
create table if not exists public.comments (
  id          uuid        primary key default uuid_generate_v4(),
  post_id     uuid        not null references public.posts(id) on delete cascade,
  parent_id   uuid        references public.comments(id) on delete cascade,
  author_id   uuid        not null references public.profiles(id) on delete cascade,
  content     text        not null,
  vote_score  int         not null default 0,
  is_deleted  boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists comments_post_idx    on public.comments(post_id);
create index if not exists comments_parent_idx  on public.comments(parent_id);
create index if not exists comments_author_idx  on public.comments(author_id);

create trigger trg_comments_updated_at
  before update on public.comments
  for each row execute procedure public.set_updated_at();

-- Maintain comment_count on posts
create or replace function public.update_post_comment_count()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set comment_count = greatest(0, comment_count - 1) where id = old.post_id;
  end if;
  return null;
end;
$$;

create trigger trg_post_comment_count
  after insert or delete on public.comments
  for each row execute procedure public.update_post_comment_count();

-- Comment votes
create table if not exists public.comment_votes (
  id         uuid      primary key default uuid_generate_v4(),
  comment_id uuid      not null references public.comments(id) on delete cascade,
  user_id    uuid      not null references public.profiles(id) on delete cascade,
  vote       smallint  not null check (vote in (1, -1)),
  created_at timestamptz not null default now(),
  unique(comment_id, user_id)
);

create index if not exists comment_votes_comment_idx on public.comment_votes(comment_id);

-- Maintain vote_score on comments
create or replace function public.update_comment_vote_score()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    update public.comments set vote_score = vote_score + new.vote where id = new.comment_id;
  elsif tg_op = 'DELETE' then
    update public.comments set vote_score = vote_score - old.vote where id = old.comment_id;
  elsif tg_op = 'UPDATE' then
    update public.comments set vote_score = vote_score - old.vote + new.vote where id = new.comment_id;
  end if;
  return null;
end;
$$;

create trigger trg_comment_vote_score
  after insert or delete or update on public.comment_votes
  for each row execute procedure public.update_comment_vote_score();

-- Notifications
create table if not exists public.notifications (
  id         uuid        primary key default uuid_generate_v4(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  type       text        not null,  -- 'new_post', 'comment_reply', 'post_vote'
  title      text        not null,
  body       text,
  link       text,
  is_read    boolean     not null default false,
  data       jsonb,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx    on public.notifications(user_id);
create index if not exists notifications_unread_idx  on public.notifications(user_id, is_read) where is_read = false;

-- ─── Phase 7: NGO ─────────────────────────────────────────────────────────────

-- NGO Updates (news posts by NGOs)
create table if not exists public.ngo_updates (
  id         uuid        primary key default uuid_generate_v4(),
  ngo_id     uuid        not null references public.profiles(id) on delete cascade,
  title      text        not null,
  content    text        not null,
  image_url  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ngo_updates_ngo_idx on public.ngo_updates(ngo_id);

create trigger trg_ngo_updates_updated_at
  before update on public.ngo_updates
  for each row execute procedure public.set_updated_at();

-- Donations
create table if not exists public.donations (
  id                       uuid           primary key default uuid_generate_v4(),
  donor_id                 uuid           not null references public.profiles(id) on delete cascade,
  ngo_id                   uuid           not null references public.profiles(id) on delete cascade,
  amount                   numeric(10,2)  not null check (amount > 0),
  currency                 text           not null default 'usd',
  status                   text           not null default 'pending'
                                          check (status in ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_intent_id text,
  message                  text,
  is_anonymous             boolean        not null default false,
  created_at               timestamptz    not null default now()
);

create index if not exists donations_donor_idx on public.donations(donor_id);
create index if not exists donations_ngo_idx   on public.donations(ngo_id);

-- ─── RLS Policies ─────────────────────────────────────────────────────────────

alter table public.communities        enable row level security;
alter table public.community_members  enable row level security;
alter table public.posts              enable row level security;
alter table public.post_votes         enable row level security;
alter table public.comments           enable row level security;
alter table public.comment_votes      enable row level security;
alter table public.notifications      enable row level security;
alter table public.ngo_updates        enable row level security;
alter table public.donations          enable row level security;

-- Communities: public read, authenticated users can create/update own
create policy "communities_public_read"   on public.communities for select using (true);
create policy "communities_auth_insert"   on public.communities for insert to authenticated with check (auth.uid() = created_by);
create policy "communities_creator_update" on public.communities for update using (auth.uid() = created_by);

-- Community members: public read, own insert/delete
create policy "cm_public_read"  on public.community_members for select using (true);
create policy "cm_own_insert"   on public.community_members for insert to authenticated with check (auth.uid() = user_id);
create policy "cm_own_delete"   on public.community_members for delete using (auth.uid() = user_id);

-- Posts: public read, author write
create policy "posts_public_read"   on public.posts for select using (true);
create policy "posts_auth_insert"   on public.posts for insert to authenticated with check (auth.uid() = author_id);
create policy "posts_author_update" on public.posts for update using (auth.uid() = author_id);
create policy "posts_author_delete" on public.posts for delete using (auth.uid() = author_id);

-- Post votes: own CRUD
create policy "post_votes_own_read"   on public.post_votes for select using (auth.uid() = user_id);
create policy "post_votes_own_insert" on public.post_votes for insert to authenticated with check (auth.uid() = user_id);
create policy "post_votes_own_update" on public.post_votes for update using (auth.uid() = user_id);
create policy "post_votes_own_delete" on public.post_votes for delete using (auth.uid() = user_id);

-- Comments: public read, author write
create policy "comments_public_read"   on public.comments for select using (true);
create policy "comments_auth_insert"   on public.comments for insert to authenticated with check (auth.uid() = author_id);
create policy "comments_author_update" on public.comments for update using (auth.uid() = author_id);
create policy "comments_author_delete" on public.comments for delete using (auth.uid() = author_id);

-- Comment votes: own CRUD
create policy "cv_own_read"   on public.comment_votes for select using (auth.uid() = user_id);
create policy "cv_own_insert" on public.comment_votes for insert to authenticated with check (auth.uid() = user_id);
create policy "cv_own_update" on public.comment_votes for update using (auth.uid() = user_id);
create policy "cv_own_delete" on public.comment_votes for delete using (auth.uid() = user_id);

-- Notifications: own only
create policy "notifs_own" on public.notifications for all using (auth.uid() = user_id);

-- NGO updates: public read, NGO owner write
create policy "ngo_updates_public_read"  on public.ngo_updates for select using (true);
create policy "ngo_updates_ngo_insert"   on public.ngo_updates for insert to authenticated with check (auth.uid() = ngo_id);
create policy "ngo_updates_ngo_update"   on public.ngo_updates for update using (auth.uid() = ngo_id);
create policy "ngo_updates_ngo_delete"   on public.ngo_updates for delete using (auth.uid() = ngo_id);

-- Donations: donor + NGO can read own; donor inserts
create policy "donations_donor_read"  on public.donations for select using (auth.uid() = donor_id);
create policy "donations_ngo_read"    on public.donations for select using (auth.uid() = ngo_id);
create policy "donations_auth_insert" on public.donations for insert to authenticated with check (auth.uid() = donor_id);

-- ─── Realtime ─────────────────────────────────────────────────────────────────
-- Enable realtime for live notification updates
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.posts;
