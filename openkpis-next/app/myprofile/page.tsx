import React from 'react';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { currentAppEnv, withTablePrefix } from '@/src/types/entities';
import type { AnyEntity, EntityKind } from '@/src/types/entities';
import MyProfileClient from './MyProfileClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const profileTable = 'user_profiles';
const likesTable = withTablePrefix('likes');
const contributionsTable = withTablePrefix('contributions');
const entityTableMap: Record<EntityKind, string> = {
  kpi: withTablePrefix('kpis'),
  event: withTablePrefix('events'),
  dimension: withTablePrefix('dimensions'),
  metric: withTablePrefix('metrics'),
  dashboard: withTablePrefix('dashboards'),
};

type ProfileSummaryRow = {
  total_kpis: number | null;
  total_events: number | null;
  total_dimensions: number | null;
  total_metrics: number | null;
  total_likes: number | null;
};

type LikeRecord = {
  item_type: EntityKind;
  item_id: string;
};

type FavoriteRecord = LikeRecord & {
  item_slug: string | null;
  item_data: AnyEntity | null;
};

type Stats = {
  totalKPIs: number;
  totalEvents: number;
  totalDimensions: number;
  totalMetrics: number;
  totalLikes: number;
};

export default async function MyProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const typedUser = user as User;
  const appEnv = currentAppEnv();

  // Load profile stats
  const { data: profile } = await supabase
    .from(profileTable)
    .select('total_kpis, total_events, total_dimensions, total_metrics, total_likes')
    .eq('id', typedUser.id)
    .eq('app_env', appEnv)
    .maybeSingle();

  const profileSummary = (profile ?? null) as ProfileSummaryRow | null;

  const stats: Stats = {
    totalKPIs: profileSummary?.total_kpis ?? 0,
    totalEvents: profileSummary?.total_events ?? 0,
    totalDimensions: profileSummary?.total_dimensions ?? 0,
    totalMetrics: profileSummary?.total_metrics ?? 0,
    totalLikes: profileSummary?.total_likes ?? 0,
  };

  // Load favorites with full item details
  const { data: likes } = await supabase
    .from(likesTable)
    .select('item_type, item_id')
    .eq('user_id', typedUser.id)
    .order('created_at', { ascending: false });

  const favoritesWithDetails: FavoriteRecord[] = [];

  const likeRecords = (likes ?? []) as LikeRecord[];
  for (const like of likeRecords) {
    const tableName = entityTableMap[like.item_type];

    const { data: item } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', like.item_id)
      .single();

    if (item) {
      const typedItem = item as AnyEntity & { path_slug?: string | null };
      const computedSlug =
        typedItem.slug ||
        (typeof typedItem.path_slug === 'string' ? typedItem.path_slug : null);
      favoritesWithDetails.push({
        ...like,
        item_slug: computedSlug,
        item_data: typedItem,
      });
    }
  }

  // Load contributions
  const { data: contributions } = await supabase
    .from(contributionsTable)
    .select('*')
    .eq('user_id', typedUser.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <MyProfileClient
      user={typedUser}
      stats={stats}
      favorites={favoritesWithDetails}
      contributions={contributions || []}
    />
  );
}

