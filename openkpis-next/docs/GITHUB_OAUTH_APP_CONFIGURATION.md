# GitHub OAuth App Configuration

## Two Different GitHub Apps

The application uses **TWO different GitHub apps** for different purposes:

### 1. GitHub OAuth App (User Authentication)
**Purpose:** User sign-in/login  
**Where configured:** Supabase Dashboard  
**Used by:** `lib/supabase/auth.ts` → `signInWithGitHub()`

### 2. GitHub App (Repository Access - Bot)
**Purpose:** Creating commits/PRs when user token unavailable  
**Where configured:** Vercel Environment Variables  
**Used by:** `lib/services/github.ts` → `commitWithBotToken()`

---

## 1. GitHub OAuth App (User Login)

### Where It's Configured

**NOT in .env files** - Configured in **Supabase Dashboard**:

1. Go to: [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to: **Authentication** → **Providers** → **GitHub**
4. Configure:
   - ✅ **Enabled**: Toggle ON
   - ✅ **Client ID**: From GitHub OAuth App
   - ✅ **Client Secret**: From GitHub OAuth App
   - ✅ **Redirect URL**: Auto-configured by Supabase

### How to Create GitHub OAuth App

1. Go to: `https://github.com/settings/developers` (or `https://github.com/organizations/OpenKPIs/settings/developers` for org)
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name**: `OpenKPIs` (or `OpenKPIs DEV`)
   - **Homepage URL**: `https://dev.openkpis.org` (or your app URL)
   - **Authorization callback URL**: `https://YOUR-SUPABASE-PROJECT.supabase.co/auth/v1/callback`
     - Get Supabase URL from: Supabase Dashboard → Settings → API → Project URL
4. Click **"Register application"**
5. Copy:
   - **Client ID** → Paste in Supabase Dashboard
   - **Client Secret** → Generate and paste in Supabase Dashboard

### Environment Variables for OAuth

**Required in .env/Vercel:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...  # Also called "anon key"
SUPABASE_SECRET_KEY=eyJhbGc...  # For admin operations (server-side only)
```

**OAuth credentials (Client ID/Secret) are configured in Supabase Dashboard, NOT in .env!**

### Code That Uses OAuth App

```typescript
// lib/supabase/auth.ts
await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    scopes: 'read:user user:email repo',  // ← Scopes requested
  },
});
```

**Note:** Scopes are set in **code** (line 58), not in Supabase Dashboard.

---

## 2. GitHub App (Bot/Repository Access)

### Where It's Configured

**In Vercel Environment Variables** (or `.env.local` for local dev):

### Required Environment Variables

```bash
# GitHub App credentials (for bot fallback)
GITHUB_APP_ID=123456                    # GitHub App ID
GITHUB_INSTALLATION_ID=12345678         # Installation ID
GITHUB_APP_PRIVATE_KEY_B64=LS0tLS...   # Base64-encoded private key

# Repository configuration
GITHUB_REPO_OWNER=devyendarm            # Repository owner (org or user)
GITHUB_CONTENT_REPO_NAME=OpenKPIs-Content-Dev  # Content repository name

# Webhook (optional, for PR events)
GITHUB_WEBHOOK_SECRET=your-webhook-secret
```

### How to Create GitHub App

1. Go to: `https://github.com/settings/apps` (or `https://github.com/organizations/OpenKPIs/settings/apps` for org)
2. Click **"New GitHub App"**
3. Fill in:
   - **GitHub App name**: `OpenKPIs Bot` (or similar)
   - **Webhook URL**: `https://dev.openkpis.org/api/webhooks/github`
   - **Webhook secret**: Generate a secret (save it → `GITHUB_WEBHOOK_SECRET`)
   - **Repository permissions**:
     - Contents: Read & Write
     - Pull requests: Read & Write
     - Metadata: Read-only
4. Click **"Create GitHub App"**
5. **Install the app** on your repository:
   - Go to app settings → "Install App"
   - Select repository: `OpenKPIs-Content-Dev`
   - Click "Install"
6. Copy:
   - **App ID** → `GITHUB_APP_ID`
   - **Installation ID** → `GITHUB_INSTALLATION_ID`
   - **Private Key** → Generate → Base64 encode → `GITHUB_APP_PRIVATE_KEY_B64`

### Code That Uses GitHub App

```typescript
// lib/services/github.ts - commitWithBotToken()
const octokit = new Octokit({
  authStrategy: createAppAuth,
  auth: {
    appId: Number(process.env.GITHUB_APP_ID),
    privateKey: resolvePrivateKey(),  // From GITHUB_APP_PRIVATE_KEY_B64
    installationId: parseInt(process.env.GITHUB_INSTALLATION_ID, 10),
  },
});
```

---

## Summary: Which App for What?

| Purpose | App Type | Configured In | Environment Variables |
|---------|----------|---------------|----------------------|
| **User Login** | GitHub OAuth App | Supabase Dashboard | None (Supabase handles it) |
| **User Commits** | User's OAuth Token | Supabase Session | None (stored in cookie/user_metadata) |
| **Bot Commits** | GitHub App | Vercel .env | `GITHUB_APP_ID`, `GITHUB_INSTALLATION_ID`, `GITHUB_APP_PRIVATE_KEY_B64` |

---

## Complete Environment Variables List

### For Supabase (OAuth Login)
```bash
# Required for Supabase connection (set in Vercel .env):
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...  # Also called "anon/public key"
SUPABASE_SECRET_KEY=eyJhbGc...  # For admin operations (server-side only)

# OAuth credentials (Client ID/Secret) are configured in Supabase Dashboard:
# Go to: Supabase Dashboard → Authentication → Providers → GitHub
# Enter: Client ID and Client Secret from GitHub OAuth App
```

### For GitHub App (Bot/Repository)
```bash
# Required for bot fallback commits
GITHUB_APP_ID=123456
GITHUB_INSTALLATION_ID=12345678
GITHUB_APP_PRIVATE_KEY_B64=LS0tLS1CRUdJTi...

# Repository configuration
GITHUB_REPO_OWNER=devyendarm
GITHUB_CONTENT_REPO_NAME=OpenKPIs-Content-Dev
GITHUB_CONTENT_REPO=devyendarm/OpenKPIs-Content-Dev  # Alternative

# Webhook (optional)
GITHUB_WEBHOOK_SECRET=your-secret-here
```

### For User OAuth Token (Contributions)
```bash
# NONE - Token is stored in:
# 1. Cookie: openkpis_github_token (set by auth/callback/route.ts)
# 2. Supabase user_metadata: github_oauth_token (set by auth/callback/route.ts)
```

---

## Verification Checklist

### OAuth App (Login)
- [ ] GitHub OAuth App created at `github.com/settings/developers`
- [ ] Callback URL set to: `https://YOUR-SUPABASE.supabase.co/auth/v1/callback`
- [ ] Client ID and Secret copied to Supabase Dashboard
- [ ] Supabase → Authentication → Providers → GitHub → Enabled

### GitHub App (Bot)
- [ ] GitHub App created at `github.com/settings/apps`
- [ ] App installed on `OpenKPIs-Content-Dev` repository
- [ ] Environment variables set in Vercel:
  - [ ] `GITHUB_APP_ID`
  - [ ] `GITHUB_INSTALLATION_ID`
  - [ ] `GITHUB_APP_PRIVATE_KEY_B64`
  - [ ] `GITHUB_REPO_OWNER`
  - [ ] `GITHUB_CONTENT_REPO_NAME`

### User Token (Contributions)
- [ ] User signs in with GitHub
- [ ] Token stored in cookie: `openkpis_github_token`
- [ ] Token stored in Supabase: `user_metadata.github_oauth_token`
- [ ] Token has `repo` scope (user must grant "Repositories: Public and private")

---

## Common Confusion

**Q: Do I need GitHub OAuth credentials in .env?**  
**A: NO** - OAuth is handled by Supabase. Only configure in Supabase Dashboard.

**Q: What's the difference between OAuth App and GitHub App?**  
**A:**
- **OAuth App**: For user login (configured in Supabase)
- **GitHub App**: For bot commits (configured in Vercel .env)

**Q: Where do I get the OAuth Client ID and Secret?**  
**A:** From GitHub OAuth App → Copy to Supabase Dashboard (NOT to .env)

**Q: Where do I get GitHub App credentials?**  
**A:** From GitHub App → Copy to Vercel Environment Variables

