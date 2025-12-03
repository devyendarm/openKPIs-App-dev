# Environment Variables Reference

Complete list of all environment variables used in the OpenKPIs project.

## Quick Setup

Copy these variables to your `.env.local` file:

```bash
# ============================================
# SUPABASE (Required)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-secret-key

# ============================================
# APPLICATION ENVIRONMENT & URLs
# ============================================
NEXT_PUBLIC_APP_ENV=dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL_PROD=https://openkpis.org
NEXT_PUBLIC_BASE_URL=/OpenKPIs

# ============================================
# GITHUB - Server-Side (API Routes)
# ============================================
GITHUB_REPO_OWNER=devyendarm
GITHUB_CONTENT_REPO_NAME=openKPIs-Content
GITHUB_APP_REPO_NAME=openKPIs-App
GITHUB_APP_ID=your-github-app-id
GITHUB_INSTALLATION_ID=your-installation-id
GITHUB_APP_PRIVATE_KEY_B64=your-base64-encoded-private-key
GITHUB_WEBHOOK_SECRET=your-webhook-secret

# ============================================
# GITHUB - Client-Side (UI Links)
# ============================================
NEXT_PUBLIC_GITHUB_REPO_OWNER=devyendarm
NEXT_PUBLIC_GITHUB_CONTENT_REPO_NAME=openKPIs-Content
NEXT_PUBLIC_GITHUB_APP_REPO_NAME=openKPIs-App

# ============================================
# OPENAI (Optional - for AI features)
# ============================================
OPENAI_API_KEY=sk-proj-your-openai-api-key
OPENAI_MODEL=gpt-5-mini
OPENAI_SERVICE_TIER=default

# ============================================
# FEATURE FLAGS
# ============================================
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_ENABLE_GISCUS=true
NEXT_PUBLIC_ENABLE_COMMENTS=true
NEXT_PUBLIC_ENABLE_EXPERIMENTAL=false

# ============================================
# ADMIN & EDITOR CONFIGURATION
# ============================================
ADMIN_USER_IDS=devyendarm
EDITOR_USER_IDS=
```

---

## Detailed Reference

### Supabase (Required)

| Variable | Type | Description | Where to Get |
|----------|------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Required | Supabase project URL | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Required | Supabase publishable key | Supabase Dashboard → Settings → API → Publishable key |
| `SUPABASE_SECRET_KEY` | Required | Supabase secret key (service role) | Supabase Dashboard → Settings → API → Secret key |

**Note:** These are required for the application to function. The secret key is used for admin operations that bypass RLS.

---

### Application Environment & URLs

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_APP_ENV` | Optional | Auto-detected | Environment: `'dev'`, `'production'`, or `'prod'`. If not set, auto-detects from hostname (openkpis.org = prod, else dev) |
| `NEXT_PUBLIC_APP_URL` | Optional | `http://localhost:3000` | Current deployment URL (for development/preview) |
| `NEXT_PUBLIC_APP_URL_PROD` | Optional | `https://openkpis.org` | Production URL (used for hostname detection) |
| `NEXT_PUBLIC_BASE_URL` | Optional | `/OpenKPIs` | Base path if app is not at root |

**Environment Detection Priority:**
1. `NEXT_PUBLIC_APP_ENV` (explicit override)
2. `VERCEL_ENV` (if on Vercel: 'production', 'preview', 'development')
3. Hostname from `VERCEL_URL` or `NEXT_PUBLIC_APP_URL`
4. Default: `dev_` (all non-production)

---

### GitHub - Server-Side (API Routes)

These variables are used in server-side code (API routes, server components) for GitHub operations.

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `GITHUB_REPO_OWNER` | Optional | `devyendarm` | GitHub organization or username |
| `GITHUB_CONTENT_REPO_NAME` | Optional | `openKPIs-Content` | Content repository name (where PRs are created) |
| `GITHUB_CONTENT_REPO` | Optional | `openKPIs-Content` | Alternative name for content repo (also supported) |
| `GITHUB_APP_REPO_NAME` | Optional | `openKPIs-App` | App repository name |
| `GITHUB_APP_ID` | Required | - | GitHub App ID (for creating PRs) |
| `GITHUB_INSTALLATION_ID` | Required | - | GitHub App Installation ID |
| `GITHUB_APP_PRIVATE_KEY_B64` | Required | - | Base64-encoded GitHub App private key |
| `GITHUB_WEBHOOK_SECRET` | Required | - | Webhook secret for GitHub webhook verification |

**Where to Get GitHub Credentials:**
- **App ID & Installation ID:** GitHub → Settings → Developer settings → GitHub Apps → Your App
- **Private Key:** GitHub → Settings → Developer settings → GitHub Apps → Your App → Generate new private key
- **Webhook Secret:** GitHub Repository → Settings → Webhooks → Your Webhook → Secret

---

### GitHub - Client-Side (UI Links)

These variables are used in client components for GitHub links displayed in the UI.

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_GITHUB_REPO_OWNER` | Optional | `devyendarm` | GitHub organization/username (for UI links) |
| `NEXT_PUBLIC_GITHUB_CONTENT_REPO_NAME` | Optional | `openKPIs-Content` | Content repo name (for UI links) |
| `NEXT_PUBLIC_GITHUB_APP_REPO_NAME` | Optional | `openKPIs-App` | App repo name (for UI links) |

**Note:** These must be `NEXT_PUBLIC_*` because they're used in client-side components.

---

### OpenAI (Optional - for AI Features)

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `OPENAI_API_KEY` | Optional | - | OpenAI API key (starts with `sk-proj-` or `sk-`) |
| `OPENAI_MODEL` | Optional | `gpt-5-mini` | OpenAI model to use |
| `OPENAI_SERVICE_TIER` | Optional | `default` | Service tier: `default` or `priority` |

**Where to Get:**
- API Key: https://platform.openai.com/account/api-keys
- Only required if using AI Analyst features

---

### Feature Flags

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_ENABLE_AI_FEATURES` | Optional | `false` | Enable AI features (set to `'true'` to enable) |
| `NEXT_PUBLIC_ENABLE_GISCUS` | Optional | `false` | Enable Giscus comments (set to `'true'` to enable) |
| `NEXT_PUBLIC_ENABLE_COMMENTS` | Optional | `false` | Enable comments feature (set to `'true'` to enable) |
| `NEXT_PUBLIC_ENABLE_EXPERIMENTAL` | Optional | `false` | Enable experimental features (set to `'true'` to enable) |

**Note:** All feature flags are strings. Set to `'true'` (with quotes in shell) or `true` (in .env files) to enable.

---

### Admin & Editor Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `ADMIN_USER_IDS` | Optional | `devyendarm` | Comma-separated list of admin user identifiers (GitHub username or email) |
| `EDITOR_USER_IDS` | Optional | - | Comma-separated list of editor user identifiers (GitHub username or email) |

**Format:** Comma-separated values, e.g., `user1,user2,user3@example.com`

---

### Auto-Set Variables (Don't Set Manually)

These are automatically set by the deployment platform:

| Variable | Set By | Description |
|----------|--------|-------------|
| `VERCEL_ENV` | Vercel | Deployment environment: `'production'`, `'preview'`, or `'development'` |
| `VERCEL_URL` | Vercel | Deployment URL (format: `deployment-name.vercel.app`) |
| `NEXT_PUBLIC_VERCEL_URL` | Vercel | Public deployment URL |
| `NODE_ENV` | Next.js | Node environment: `'development'` or `'production'` |

---

## Environment-Specific Configuration

### Local Development

For local development, set these in `.env.local`:

```bash
NEXT_PUBLIC_APP_ENV=dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production (Vercel)

Set these in Vercel Dashboard → Settings → Environment Variables:

```bash
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL_PROD=https://openkpis.org
```

**Note:** Vercel automatically sets `VERCEL_ENV` and `VERCEL_URL`, so hostname detection will work automatically.

---

## Variable Naming Conventions

- **`NEXT_PUBLIC_*`**: Exposed to client-side code (browser). Use for public configuration.
- **No prefix**: Server-side only. Use for secrets and API keys.
- **`GITHUB_*`**: Server-side GitHub operations (API routes).
- **`NEXT_PUBLIC_GITHUB_*`**: Client-side GitHub links (UI components).

---

## Security Notes

1. **Never commit `.env.local`** to version control (it's in `.gitignore`)
2. **Use `NEXT_PUBLIC_*` only for public values** - these are embedded in the client bundle
3. **Keep secrets server-side** - don't use `NEXT_PUBLIC_*` for API keys or secrets
4. **Rotate keys regularly** - especially GitHub App keys and Supabase keys

---

## Verification

After setting up your `.env.local`, verify your configuration:

1. **Supabase:** Check that you can connect to your database
2. **GitHub:** Test creating a PR (should work if GitHub App is configured)
3. **OpenAI:** Test AI features (if enabled)
4. **Environment:** Check that table prefixes are correct (`dev_` for local, `prod_` for production)

---

## Troubleshooting

### "Could not find the table 'public.kpis'"
- **Cause:** Environment prefix not being applied
- **Fix:** Set `NEXT_PUBLIC_APP_ENV=dev` or ensure hostname detection is working

### "Missing server auth envs"
- **Cause:** Supabase credentials not set
- **Fix:** Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### "GitHub App not configured"
- **Cause:** GitHub App credentials missing
- **Fix:** Set `GITHUB_APP_ID`, `GITHUB_INSTALLATION_ID`, and `GITHUB_APP_PRIVATE_KEY_B64`

### Hydration mismatch errors
- **Cause:** Client and server rendering different values
- **Fix:** Ensure all `NEXT_PUBLIC_*` variables are set consistently

