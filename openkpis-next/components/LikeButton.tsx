'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/providers/AuthClientProvider';
import { signInWithGitHub } from '@/lib/supabase/auth';

interface LikeButtonProps {
  itemType: 'kpi' | 'event' | 'dimension' | 'metric' | 'dashboard';
  itemId: string;
  itemSlug: string;
}

type LikeSummary = {
  count: number;
  liked: boolean;
};

export default function LikeButton({ itemType, itemId, itemSlug }: LikeButtonProps) {
  const { user, loading: authLoading } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [initializing, setInitializing] = useState(true);
  const [isMutating, setIsMutating] = useState(false);

  const fetchStatus = useCallback(async () => {
    const params = new URLSearchParams({
      itemType,
      itemId,
    });

    const response = await fetch(`/api/likes?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to load like status (${response.status})`);
    }

    const summary = (await response.json()) as LikeSummary;
    return summary;
  }, [itemId, itemType]);

  useEffect(() => {
    if (authLoading) return;

    let active = true;
    async function loadStatus() {
      try {
        setInitializing(true);
        const summary = await fetchStatus();
        if (active) {
          setLikeCount(summary.count);
          setLiked(summary.liked);
        }
      } catch (error) {
        if (active) console.error('Error loading like status:', error);
      } finally {
        if (active) setInitializing(false);
      }
    }

    void loadStatus();

    return () => {
      active = false;
    };
  }, [authLoading, fetchStatus, user?.id]);

  async function handleToggleLike() {
    if (authLoading) return;
    if (isMutating) return;

    if (!user) {
      const { error } = await signInWithGitHub();
      if (error) {
        console.error('GitHub sign-in failed for like button:', error);
        alert(error.message || 'GitHub sign-in failed. Please try again.');
      }
      return;
    }

    const previousLiked = liked;
    const previousCount = likeCount;
    const nextLiked = !liked;

    setLiked(nextLiked);
    setLikeCount((prev) => {
      if (nextLiked) return prev + 1;
      return Math.max(0, prev - 1);
    });

    setIsMutating(true);
    try {
      const method = previousLiked ? 'DELETE' : 'POST';
      const body = previousLiked
        ? JSON.stringify({
            itemType,
            itemId,
          })
        : JSON.stringify({
            itemType,
            itemId,
            itemSlug,
          });

      const response = await fetch('/api/likes', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      if (!response.ok) {
        const message = await response
          .json()
          .then((json: { error?: string }) => json.error)
          .catch(() => null);
        if (message) {
          alert(message);
        } else {
          alert(`Failed to ${previousLiked ? 'remove' : 'add'} like. Please try again.`);
        }
        throw new Error(`Request failed with status ${response.status}`);
      }

      const summary = (await response.json()) as LikeSummary;
      setLiked(summary.liked);
      setLikeCount(summary.count);
    } catch (err) {
      console.error('Error toggling like:', err);
      alert('Failed to update like. Please try again.');
      setLiked(previousLiked);
      setLikeCount(previousCount);
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <button
      onClick={handleToggleLike}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        border: 'none',
        backgroundColor: liked ? 'var(--ifm-color-primary)' : 'transparent',
        color: liked ? 'white' : 'var(--ifm-color-emphasis-700)',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: 500,
        transition: 'all 0.2s',
        opacity: isMutating ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = liked
          ? 'var(--ifm-color-primary-dark)'
          : 'var(--ifm-color-emphasis-100)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = liked
          ? 'var(--ifm-color-primary)'
          : 'transparent';
      }}
      aria-label={liked ? 'Unlike' : 'Like'}
      aria-pressed={liked}
      data-initializing={initializing}
      data-loading={isMutating}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span>{likeCount}</span>
    </button>
  );
}

