/**
 * Application Configuration
 */

export const config = {
  // Application URLs
  appUrl: {
    dev: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    prod: process.env.NEXT_PUBLIC_APP_URL_PROD || 'https://openkpis.org',
  },
  
  // Base URL
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || '/OpenKPIs',
  
  // GitHub
  github: {
    // Server-side vars (for API routes) with fallback to NEXT_PUBLIC_ (for client components)
    repoOwner: process.env.GITHUB_REPO_OWNER || process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER || 'devyendarm',
    contentRepo: process.env.GITHUB_CONTENT_REPO_NAME || process.env.GITHUB_CONTENT_REPO || process.env.NEXT_PUBLIC_GITHUB_CONTENT_REPO_NAME || 'openKPIs-Content',
    appRepo: process.env.GITHUB_APP_REPO_NAME || process.env.NEXT_PUBLIC_GITHUB_APP_REPO_NAME || 'openKPIs-App',
    // Client-accessible URLs (use NEXT_PUBLIC_ for client components)
    contentRepoFull: `${process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER || process.env.GITHUB_REPO_OWNER || 'devyendarm'}/${process.env.NEXT_PUBLIC_GITHUB_CONTENT_REPO_NAME || process.env.GITHUB_CONTENT_REPO_NAME || process.env.GITHUB_CONTENT_REPO || 'openKPIs-Content'}`,
    appRepoFull: `${process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER || process.env.GITHUB_REPO_OWNER || 'devyendarm'}/${process.env.NEXT_PUBLIC_GITHUB_APP_REPO_NAME || process.env.GITHUB_APP_REPO_NAME || 'openKPIs-App'}`,
    // GitHub URLs for UI links
    appRepoUrl: `https://github.com/${process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER || process.env.GITHUB_REPO_OWNER || 'devyendarm'}/${process.env.NEXT_PUBLIC_GITHUB_APP_REPO_NAME || process.env.GITHUB_APP_REPO_NAME || 'openKPIs-App'}`,
    contentRepoUrl: `https://github.com/${process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER || process.env.GITHUB_REPO_OWNER || 'devyendarm'}/${process.env.NEXT_PUBLIC_GITHUB_CONTENT_REPO_NAME || process.env.GITHUB_CONTENT_REPO_NAME || process.env.GITHUB_CONTENT_REPO || 'openKPIs-Content'}`,
  },
  
  // Feature Flags
  features: {
    aiEnabled: process.env.NEXT_PUBLIC_ENABLE_AI_FEATURES === 'true',
    giscusEnabled: process.env.NEXT_PUBLIC_ENABLE_GISCUS === 'true',
    commentsEnabled: process.env.NEXT_PUBLIC_ENABLE_COMMENTS === 'true',
    experimental: process.env.NEXT_PUBLIC_ENABLE_EXPERIMENTAL === 'true',
  },
  
  // Admin/Editor IDs
  adminUserIds: (process.env.ADMIN_USER_IDS || 'devyendarm').split(',').map(id => id.trim()),
  editorUserIds: (process.env.EDITOR_USER_IDS || '').split(',').filter(Boolean).map(id => id.trim()),
  
  // Environment
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
} as const;

