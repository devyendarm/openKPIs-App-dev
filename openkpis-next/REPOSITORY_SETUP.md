# Repository Setup - Two Repository Architecture

## Repository Structure

### 1. OpenKPIs-App-Dev
**Purpose:** Application code (Next.js app)  
**What goes here:**
- Application source code
- API routes
- Components
- Configuration files
- This repository (what you're working in)

**Deployment:**
- Vercel auto-deploys from this repository
- Pushes to `main` branch trigger Vercel deployment

### 2. OpenKPIs-Content-Dev
**Purpose:** Content repository (YAML files)  
**What goes here:**
- YAML files for KPIs, Metrics, Dimensions, Events, Dashboards
- Created via PRs when users create/edit items
- Structure: `data-layer/{entity-type}/{slug}.yml`

**Webhook Configuration:**
- Webhook is configured on **this repository**
- Listens for PR merge/close events
- Updates contribution status in Supabase

## How It Works

### Application Code Flow
```
Developer makes changes
  ↓
Commit to OpenKPIs-App-Dev
  ↓
Push to GitHub
  ↓
Vercel auto-deploys
```

### Content Sync Flow
```
User creates/edits item in app
  ↓
App creates PR in OpenKPIs-Content-Dev
  ↓
PR contains YAML file: data-layer/{type}/{slug}.yml
  ↓
When PR is merged → Webhook fires
  ↓
Webhook updates contribution status in Supabase
```

## Configuration

### Environment Variables Required

**All environment variables should be set in Vercel Environment Variables** (Settings → Environment Variables in your Vercel project).

**For Content Repository (PRs):**
```bash
# Repository where PRs are created
# Default: 'openKPIs-Content' (override in Vercel for dev/staging environments)
GITHUB_REPO_OWNER=devyendarm
GITHUB_CONTENT_REPO_NAME=openKPIs-Content
# OR (alternative variable name)
GITHUB_CONTENT_REPO=openKPIs-Content

# For client-side components (UI links)
NEXT_PUBLIC_GITHUB_REPO_OWNER=devyendarm
NEXT_PUBLIC_GITHUB_CONTENT_REPO_NAME=openKPIs-Content

# GitHub App credentials (must be installed on Content repo)
GITHUB_APP_ID=your-app-id
GITHUB_INSTALLATION_ID=your-installation-id
GITHUB_APP_PRIVATE_KEY_B64=base64-encoded-key
```

**For App Repository (UI links):**
```bash
# App repository name (for GitHub links in header, homepage, etc.)
# Default: 'openKPIs-App'
GITHUB_APP_REPO_NAME=openKPIs-App
NEXT_PUBLIC_GITHUB_APP_REPO_NAME=openKPIs-App
```

**For Webhook (on Content Repository):**
```bash
# Webhook secret (configured in Content repo webhook settings)
GITHUB_WEBHOOK_SECRET=your-webhook-secret
```

**Note:** 
- Default values are `openKPIs-Content` and `openKPIs-App` (production)
- Override in Vercel Environment Variables for different environments (dev/staging)
- All `NEXT_PUBLIC_*` variables are accessible in client-side components
- Server-side variables (`GITHUB_*` without `NEXT_PUBLIC_`) are only available in API routes and server components

## Current Code Configuration

### ✅ Correctly Configured
- GitHub sync service uses `GITHUB_CONTENT_REPO_NAME` or `GITHUB_CONTENT_REPO` variable
- **Default:** `'openKPIs-Content'` (production)
- Override in Vercel Environment Variables for dev/staging environments
- All PRs are created in the content repository
- Webhook handler processes events from content repository
- All GitHub links in UI are environment-driven (no hardcoded values)

### ✅ Environment Variable Priority
The code checks environment variables in this order:
1. `GITHUB_CONTENT_REPO_NAME` (server-side)
2. `GITHUB_CONTENT_REPO` (server-side, alternative)
3. `NEXT_PUBLIC_GITHUB_CONTENT_REPO_NAME` (client-side)
4. Default: `'openKPIs-Content'`

## Vercel Environment Variables

**Yes, all environment variables will be picked up from Vercel Environment Variables.**

1. Go to your Vercel project → Settings → Environment Variables
2. Add all required variables (see above)
3. Set them for the appropriate environments:
   - **Production:** Use `openKPIs-Content` (default)
   - **Preview/Development:** Override with `openKPIs-Content-Dev` if needed
4. Redeploy after adding/changing variables

**Important:**
- Variables are available at build time and runtime
- `NEXT_PUBLIC_*` variables are embedded in the client bundle
- Server-side variables are only available in API routes and server components
- Changes to environment variables require a redeploy

## Verification Checklist

- [ ] All environment variables are set in Vercel (Settings → Environment Variables)
- [ ] `GITHUB_CONTENT_REPO_NAME` or `GITHUB_CONTENT_REPO` is set (defaults to `openKPIs-Content`)
- [ ] `NEXT_PUBLIC_GITHUB_CONTENT_REPO_NAME` is set for client-side access
- [ ] `GITHUB_REPO_OWNER` and `NEXT_PUBLIC_GITHUB_REPO_OWNER` are set
- [ ] `GITHUB_APP_REPO_NAME` and `NEXT_PUBLIC_GITHUB_APP_REPO_NAME` are set
- [ ] `GITHUB_APP_ID` is set
- [ ] `GITHUB_INSTALLATION_ID` is set
- [ ] `GITHUB_APP_PRIVATE_KEY_B64` is set
- [ ] GitHub App is installed on the content repository
- [ ] Webhook is configured on the content repository
- [ ] `GITHUB_WEBHOOK_SECRET` matches webhook secret
- [ ] Test: Create item → PR created in correct Content repo
- [ ] Test: Merge PR → Webhook updates contribution status
- [ ] Test: GitHub links in UI point to correct repositories

## Summary

✅ **Code is correctly architected** for environment-driven configuration:
- Defaults to production values (`openKPIs-Content`, `openKPIs-App`)
- All GitHub links and API calls use environment variables
- Override in Vercel for different environments
- No hardcoded repository names

