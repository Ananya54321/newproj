import { getServerUser, createServerSupabaseClient } from '@/lib/supabase/server'
import { getCommunities, getPosts, getUserCommunities } from '@/lib/community/service'
import { CommunityFeedClient } from './_components/community-feed-client'

export const metadata = { title: 'Community — Furever' }

export default async function CommunityFeedPage() {
  const user = await getServerUser()
  const supabase = await createServerSupabaseClient()

  const [posts, communities, userCommunities] = await Promise.all([
    getPosts({ sort: 'hot', userId: user?.id }, supabase),
    getCommunities(supabase),
    user?.id ? getUserCommunities(user.id, supabase) : Promise.resolve([]),
  ])

  return (
    <CommunityFeedClient
      userId={user?.id ?? null}
      initialPosts={posts}
      communities={communities}
      userCommunities={userCommunities}
    />
  )
}
