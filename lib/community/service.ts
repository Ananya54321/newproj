import { supabaseClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Community,
  CommunityWithMembership,
  Post,
  PostWithMeta,
  Comment,
  CommentWithMeta,
  Notification,
  PostType,
  CommunityEvent,
  CommunityEventWithCreator,
  CommunityEventType,
} from '@/lib/auth/types'

// ─── Form data ────────────────────────────────────────────────────────────────

export interface CommunityFormData {
  name: string
  slug: string
  description?: string | null
  icon_url?: string | null
  banner_url?: string | null
  is_public?: boolean
}

export interface PostFormData {
  title: string
  content?: string | null
  type: PostType
  image_urls?: string[]
  link_url?: string | null
}

// ─── Selects ──────────────────────────────────────────────────────────────────

const POST_SELECT = `
  *,
  community:communities!posts_community_id_fkey(id, name, slug, icon_url),
  author:profiles!posts_author_id_fkey(id, full_name, avatar_url)
`

const COMMENT_SELECT = `
  *,
  author:profiles!comments_author_id_fkey(id, full_name, avatar_url)
`

// ─── Community queries ────────────────────────────────────────────────────────

export async function getCommunities(
  client: SupabaseClient = supabaseClient
): Promise<Community[]> {
  const { data, error } = await client
    .from('communities')
    .select('*')
    .eq('is_public', true)
    .order('member_count', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getCommunityBySlug(
  slug: string,
  client: SupabaseClient = supabaseClient
): Promise<Community | null> {
  const { data, error } = await client
    .from('communities')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error || !data) return null
  return data
}

export async function getUserCommunities(
  userId: string,
  client: SupabaseClient = supabaseClient
): Promise<CommunityWithMembership[]> {
  const { data: memberships, error } = await client
    .from('community_members')
    .select('community_id, role, communities(*)')
    .eq('user_id', userId)
  if (error) throw error

  return (memberships ?? []).map((m) => {
    const community = Array.isArray(m.communities) ? m.communities[0] : m.communities
    return {
      ...community,
      is_member: true,
      member_role: m.role as 'member' | 'moderator',
    } as CommunityWithMembership
  })
}

export async function getMembership(
  communityId: string,
  userId: string,
  client: SupabaseClient = supabaseClient
): Promise<{ is_member: boolean; role: 'member' | 'moderator' | null }> {
  const { data } = await client
    .from('community_members')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .maybeSingle()
  if (!data) return { is_member: false, role: null }
  return { is_member: true, role: data.role as 'member' | 'moderator' }
}

// ─── Community mutations ──────────────────────────────────────────────────────

export async function createCommunity(
  data: CommunityFormData,
  userId: string
): Promise<{ community: Community | null; error: string | null }> {
  const { data: community, error } = await supabaseClient
    .from('communities')
    .insert({ ...data, created_by: userId })
    .select()
    .single()
  if (error) return { community: null, error: error.message }

  // Auto-join creator as moderator
  await supabaseClient
    .from('community_members')
    .insert({ community_id: community.id, user_id: userId, role: 'moderator' })

  return { community, error: null }
}

export async function joinCommunity(
  communityId: string,
  userId: string
): Promise<{ error: string | null }> {
  const { error } = await supabaseClient
    .from('community_members')
    .insert({ community_id: communityId, user_id: userId, role: 'member' })
  return { error: error?.message ?? null }
}

export async function leaveCommunity(
  communityId: string,
  userId: string
): Promise<{ error: string | null }> {
  const { error } = await supabaseClient
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', userId)
  return { error: error?.message ?? null }
}

// ─── Post queries ─────────────────────────────────────────────────────────────

export type PostSort = 'new' | 'top' | 'hot'

export async function getPosts(
  options: {
    communityId?: string
    sort?: PostSort
    limit?: number
    userId?: string
  } = {},
  client: SupabaseClient = supabaseClient
): Promise<PostWithMeta[]> {
  const { communityId, sort = 'new', limit = 25, userId } = options

  let query = client.from('posts').select(POST_SELECT)
  if (communityId) query = query.eq('community_id', communityId)

  if (sort === 'new') query = query.order('created_at', { ascending: false })
  else if (sort === 'top') query = query.order('vote_score', { ascending: false })
  else {
    // hot: recent posts weighted by votes — order by created_at desc as approximation
    query = query.order('created_at', { ascending: false })
  }

  query = query.limit(limit)
  const { data, error } = await query
  if (error) throw error

  const posts = (data ?? []).map(normalizePost)

  if (!userId) return posts.map((p) => ({ ...p, user_vote: null }))

  // Fetch votes for this user
  const postIds = posts.map((p) => p.id)
  if (postIds.length === 0) return posts.map((p) => ({ ...p, user_vote: null }))

  const { data: votes } = await client
    .from('post_votes')
    .select('post_id, vote')
    .eq('user_id', userId)
    .in('post_id', postIds)

  const voteMap = new Map((votes ?? []).map((v) => [v.post_id, v.vote as 1 | -1]))
  return posts.map((p) => ({ ...p, user_vote: voteMap.get(p.id) ?? null }))
}

export async function getPostById(
  postId: string,
  userId?: string,
  client: SupabaseClient = supabaseClient
): Promise<PostWithMeta | null> {
  const { data, error } = await client
    .from('posts')
    .select(POST_SELECT)
    .eq('id', postId)
    .single()
  if (error || !data) return null

  const post = normalizePost(data)
  let userVote: 1 | -1 | null = null

  if (userId) {
    const { data: voteRow } = await client
      .from('post_votes')
      .select('vote')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle()
    userVote = voteRow ? (voteRow.vote as 1 | -1) : null
  }

  return { ...post, user_vote: userVote }
}

// ─── Post mutations ───────────────────────────────────────────────────────────

export async function createPost(
  data: PostFormData,
  communityId: string,
  authorId: string
): Promise<{ post: Post | null; error: string | null }> {
  const { data: post, error } = await supabaseClient
    .from('posts')
    .insert({
      community_id: communityId,
      author_id: authorId,
      title: data.title.trim(),
      content: data.content?.trim() || null,
      type: data.type,
      image_urls: data.image_urls ?? [],
      link_url: data.link_url?.trim() || null,
    })
    .select()
    .single()

  if (error) return { post: null, error: error.message }

  // Notify community followers (fire-and-forget)
  notifyCommunityFollowers(communityId, post.id, data.title, authorId).catch(console.error)

  return { post, error: null }
}

export async function deletePost(postId: string): Promise<{ error: string | null }> {
  const { error } = await supabaseClient.from('posts').delete().eq('id', postId)
  return { error: error?.message ?? null }
}

// ─── Vote mutations ───────────────────────────────────────────────────────────

/** Upsert a post vote. Passing the same vote again removes it (toggle). */
export async function votePost(
  postId: string,
  userId: string,
  vote: 1 | -1
): Promise<{ newVote: 1 | -1 | null; error: string | null }> {
  // Check current vote
  const { data: existing } = await supabaseClient
    .from('post_votes')
    .select('vote')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing?.vote === vote) {
    // Same vote — remove it
    const { error } = await supabaseClient
      .from('post_votes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)
    return { newVote: null, error: error?.message ?? null }
  }

  const { error } = await supabaseClient
    .from('post_votes')
    .upsert({ post_id: postId, user_id: userId, vote }, { onConflict: 'post_id,user_id' })
  return { newVote: vote, error: error?.message ?? null }
}

/** Upsert a comment vote. Passing same vote removes it (toggle). */
export async function voteComment(
  commentId: string,
  userId: string,
  vote: 1 | -1
): Promise<{ newVote: 1 | -1 | null; error: string | null }> {
  const { data: existing } = await supabaseClient
    .from('comment_votes')
    .select('vote')
    .eq('comment_id', commentId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing?.vote === vote) {
    const { error } = await supabaseClient
      .from('comment_votes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId)
    return { newVote: null, error: error?.message ?? null }
  }

  const { error } = await supabaseClient
    .from('comment_votes')
    .upsert({ comment_id: commentId, user_id: userId, vote }, { onConflict: 'comment_id,user_id' })
  return { newVote: vote, error: error?.message ?? null }
}

// ─── Comment queries ──────────────────────────────────────────────────────────

export async function getComments(
  postId: string,
  userId?: string,
  client: SupabaseClient = supabaseClient
): Promise<CommentWithMeta[]> {
  const { data, error } = await client
    .from('comments')
    .select(COMMENT_SELECT)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (error) throw error

  const comments = (data ?? []).map(normalizeComment)

  let voteMap = new Map<string, 1 | -1>()
  if (userId && comments.length > 0) {
    const { data: votes } = await client
      .from('comment_votes')
      .select('comment_id, vote')
      .eq('user_id', userId)
      .in('comment_id', comments.map((c) => c.id))
    voteMap = new Map((votes ?? []).map((v) => [v.comment_id, v.vote as 1 | -1]))
  }

  // Build tree: separate top-level from replies
  const withVotes = comments.map((c) => ({
    ...c,
    user_vote: voteMap.get(c.id) ?? null,
    replies: [] as CommentWithMeta[],
  }))

  const byId = new Map(withVotes.map((c) => [c.id, c]))
  const roots: CommentWithMeta[] = []

  for (const c of withVotes) {
    if (c.parent_id && byId.has(c.parent_id)) {
      byId.get(c.parent_id)!.replies.push(c)
    } else {
      roots.push(c)
    }
  }

  return roots
}

// ─── Comment mutations ────────────────────────────────────────────────────────

export async function createComment(
  postId: string,
  authorId: string,
  content: string,
  parentId?: string | null
): Promise<{ comment: Comment | null; error: string | null }> {
  const { data, error } = await supabaseClient
    .from('comments')
    .insert({
      post_id: postId,
      author_id: authorId,
      content: content.trim(),
      parent_id: parentId ?? null,
    })
    .select()
    .single()
  if (error) return { comment: null, error: error.message }
  return { comment: data as Comment, error: null }
}

export async function deleteComment(commentId: string): Promise<{ error: string | null }> {
  // Soft-delete: mark is_deleted, clear content
  const { error } = await supabaseClient
    .from('comments')
    .update({ is_deleted: true, content: '[deleted]' })
    .eq('id', commentId)
  return { error: error?.message ?? null }
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getNotifications(
  userId: string,
  client: SupabaseClient = supabaseClient
): Promise<Notification[]> {
  const { data, error } = await client
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data ?? []
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await supabaseClient
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await supabaseClient
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
}

// ─── Private helpers ──────────────────────────────────────────────────────────

async function notifyCommunityFollowers(
  communityId: string,
  postId: string,
  postTitle: string,
  authorId: string
): Promise<void> {
  // Get all community members except the author
  const { data: members } = await supabaseClient
    .from('community_members')
    .select('user_id')
    .eq('community_id', communityId)
    .neq('user_id', authorId)

  if (!members || members.length === 0) return

  // Get community name for notification title
  const { data: community } = await supabaseClient
    .from('communities')
    .select('name')
    .eq('id', communityId)
    .single()

  const notifications = members.map((m) => ({
    user_id: m.user_id,
    type: 'new_post',
    title: `New post in ${community?.name ?? 'a community you follow'}`,
    body: postTitle,
    link: `/community/${communityId}/post/${postId}`,
    data: { post_id: postId, community_id: communityId },
  }))

  // Insert in batches of 50 to avoid DB limits
  for (let i = 0; i < notifications.length; i += 50) {
    await supabaseClient.from('notifications').insert(notifications.slice(i, i + 50))
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizePost(raw: any): PostWithMeta {
  const community = Array.isArray(raw.community) ? raw.community[0] : raw.community
  const author = Array.isArray(raw.author) ? raw.author[0] : raw.author
  return { ...raw, community, author, user_vote: null } as PostWithMeta
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeComment(raw: any): CommentWithMeta {
  const author = Array.isArray(raw.author) ? raw.author[0] : raw.author
  return { ...raw, author, user_vote: null, replies: [] } as CommentWithMeta
}

// ─── Community Events ─────────────────────────────────────────────────────────

export interface CommunityEventFormData {
  title: string
  description?: string | null
  type: CommunityEventType
  location?: string | null
  event_date: string
  image_url?: string | null
  registration_url?: string | null
}

export async function getCommunityEvents(
  communityId: string,
  client: SupabaseClient = supabaseClient
): Promise<CommunityEventWithCreator[]> {
  const { data, error } = await client
    .from('community_events')
    .select(`*, creator:profiles!community_events_creator_id_fkey(id, full_name, avatar_url)`)
    .eq('community_id', communityId)
    .eq('is_active', true)
    .order('event_date', { ascending: true })
  if (error) throw error
  return ((data ?? []) as unknown[]).map((raw) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = raw as any
    return { ...r, creator: Array.isArray(r.creator) ? r.creator[0] : r.creator }
  }) as CommunityEventWithCreator[]
}

export async function createCommunityEvent(
  data: CommunityEventFormData,
  communityId: string,
  creatorId: string
): Promise<{ event: CommunityEvent | null; error: string | null }> {
  const { data: event, error } = await supabaseClient
    .from('community_events')
    .insert({ ...data, community_id: communityId, creator_id: creatorId })
    .select()
    .single()
  if (error) return { event: null, error: error.message }
  return { event: event as CommunityEvent, error: null }
}

export async function deleteCommunityEvent(eventId: string): Promise<{ error: string | null }> {
  const { error } = await supabaseClient
    .from('community_events')
    .update({ is_active: false })
    .eq('id', eventId)
  return { error: error?.message ?? null }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function formatPostDate(isoString: string): string {
  const d = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffM = Math.floor(diffMs / 60_000)
  if (diffM < 1) return 'just now'
  if (diffM < 60) return `${diffM}m ago`
  const diffH = Math.floor(diffM / 60)
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
