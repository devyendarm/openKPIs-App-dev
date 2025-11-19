'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { signInWithGitHub } from '@/lib/supabase/auth';
import { useAuth } from '@/app/providers/AuthClientProvider';

interface GiscusCommentsProps {
  term?: string;
  category?: string;
}

type SessionWithAccessToken = Session & { 
  provider_access_token?: string | null;
  provider_token?: string | null;
  provider_refresh_token?: string | null;
};

type GiscusMessage = {
  giscus?: {
    signIn?: boolean;
    signOut?: boolean;
  };
};

async function extractProviderToken(): Promise<string | null> {
  try {
    // First, try to get from client-side session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    
    // Try multiple ways to get the GitHub token from session
    const extended = session as SessionWithAccessToken;
    
    // First, try direct properties
    if (session.provider_token) {
      return session.provider_token;
    }
    
    if (extended.provider_access_token) {
      return extended.provider_access_token;
    }
    
    // Try to get from user metadata (sometimes stored there)
    const user = session.user;
    if (user?.user_metadata?.provider_token) {
      return user.user_metadata.provider_token as string;
    }
    
    // If not found in client session, try fetching from server API
    // This is needed because Supabase might not expose provider tokens
    // directly in the client-side session object
    try {
      const response = await fetch('/api/auth/github-token', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          return data.token;
        }
      }
    } catch (apiError) {
      console.warn('Failed to fetch token from API:', apiError);
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting provider token:', error);
    return null;
  }
}

export default function GiscusComments({ term, category = 'kpis' }: GiscusCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user, loading: authLoading } = useAuth();
  const [giscusLoaded, setGiscusLoaded] = useState(false);
  const [githubToken, setGithubToken] = useState<string | null>(null);
  const [tokenRetryCount, setTokenRetryCount] = useState(0);

  // Function to fetch and set the GitHub token
  const fetchGitHubToken = useCallback(async (retry = false) => {
    if (!user) {
      setGithubToken(null);
      return;
    }

    const token = await extractProviderToken();
    if (token) {
      setGithubToken(token);
      setTokenRetryCount(0);
    } else if (retry && tokenRetryCount < 3) {
      // Retry a few times as the token might not be immediately available after sign-in
      setTimeout(() => {
        setTokenRetryCount((prev) => prev + 1);
        void fetchGitHubToken(true);
      }, 1000 * (tokenRetryCount + 1));
    }
  }, [user, tokenRetryCount]);

  const updateGiscusAuth = useCallback((token: string | null) => {
    const iframe = containerRef.current?.querySelector('iframe');
    if (!iframe || !iframe.contentWindow) {
      // Iframe not ready yet, try again after a short delay
      if (token) {
        setTimeout(() => updateGiscusAuth(token), 500);
      }
      return;
    }

    try {
      if (token) {
        // Update Giscus with GitHub token using the correct format
        // Giscus expects the token in the session property
        iframe.contentWindow.postMessage(
          {
            giscus: {
              setConfig: {
                session: token,
              },
            },
          },
          'https://giscus.app'
        );
      } else {
        // Sign out of Giscus
        iframe.contentWindow.postMessage(
          {
            giscus: {
              signOut: true,
            },
          },
          'https://giscus.app'
        );
      }
    } catch (err) {
      console.error('Failed to update Giscus auth:', err);
    }
  }, []);

  // Fetch token when user changes
  useEffect(() => {
    if (!authLoading) {
      void fetchGitHubToken(true);
    }
  }, [user, authLoading, fetchGitHubToken]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Wait a bit for the session to fully initialize
        setTimeout(() => {
          void fetchGitHubToken(true);
        }, 500);
      } else if (event === 'SIGNED_OUT') {
        setGithubToken(null);
        if (giscusLoaded) {
          updateGiscusAuth(null);
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Token refreshed, try to get provider token again
        void fetchGitHubToken(true);
      }
    });

    // Listen for manual sign out events
    const handleSignOut = () => {
      setGithubToken(null);
      if (giscusLoaded) {
        updateGiscusAuth(null);
      }
    };
    window.addEventListener('openkpis-sign-out', handleSignOut);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('openkpis-sign-out', handleSignOut);
    };
  }, [giscusLoaded, fetchGitHubToken, updateGiscusAuth]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing script
    const container = containerRef.current;
    const existingScript = container?.querySelector('script');
    if (existingScript) {
      existingScript.remove();
    }

    // Clear the container
    if (container) {
      container.innerHTML = '';
    }

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'devyendarm/OpenKPIs');
    script.setAttribute('data-repo-id', 'R_kgDOP1g99A');
    script.setAttribute('data-category', 'Q&A');
    script.setAttribute('data-category-id', 'DIC_kwDOP1g99M4CxJez');
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '1');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', 'light');
    script.setAttribute('data-lang', 'en');
    script.setAttribute('data-loading', 'lazy');
    script.setAttribute('crossorigin', 'anonymous');
    
    // Set GitHub token if available (before loading Giscus)
    if (githubToken) {
      script.setAttribute('data-session', githubToken);
    }

    script.async = true;

    // Set up onload handler
    script.onload = () => {
      setGiscusLoaded(true);
      
      // If we have a token, send it to Giscus after it loads
      if (githubToken) {
        setTimeout(() => {
          updateGiscusAuth(githubToken);
        }, 1000);
      }
    };

    container?.appendChild(script);

    // Listen for messages from Giscus
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://giscus.app') return;
      const message = event.data as GiscusMessage;
      
      // Giscus is requesting sign-in
      if (message.giscus?.signIn) {
        if (user && !authLoading) {
          // User is signed in to site but Giscus doesn't have token
          // Try to fetch and send the token
          void fetchGitHubToken(true);
        } else if (!user && !authLoading) {
          // User not signed in to site - sign them in first
          // After site sign-in, Giscus will need its own OAuth flow
          // since Supabase doesn't expose provider tokens
          signInWithGitHub().catch((err) => {
            console.error('Failed to sign in:', err);
          });
        }
        // Note: Even after site sign-in, Giscus may still require its own OAuth
        // because Supabase doesn't expose GitHub provider tokens by default.
        // Users can still view comments without signing in to Giscus.
      }
      
      // Giscus signed out - sync with Supabase (only if user explicitly signed out from Giscus)
      // Don't auto-sign out from site if Giscus signs out
      if (message.giscus?.signOut && user) {
        // Just clear the token, don't sign out from the site
        setGithubToken(null);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      if (container && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [term, category, user, githubToken, authLoading, fetchGitHubToken, updateGiscusAuth]);

  // Update Giscus when token changes or when it loads
  useEffect(() => {
    if (giscusLoaded && githubToken) {
      // Token available, send it to Giscus
      updateGiscusAuth(githubToken);
    } else if (giscusLoaded && !githubToken && user && !authLoading) {
      // Giscus is loaded, user is signed in, but no token yet
      // Try to fetch it again
      void fetchGitHubToken(true);
    }
  }, [githubToken, giscusLoaded, user, authLoading, updateGiscusAuth, fetchGitHubToken]);

  return <div ref={containerRef} style={{ marginTop: '3rem' }} />;
}

