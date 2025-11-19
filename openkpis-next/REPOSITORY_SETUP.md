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

**For Content Repository (PRs):**
```bash
# Repository where PRs are created
GITHUB_REPO_OWNER=devyendarm
GITHUB_CONTENT_REPO_NAME=openKPIs-Content-Dev
# OR
GITHUB_CONTENT_REPO=openKPIs-Content-Dev

# GitHub App credentials (must be installed on Content repo)
GITHUB_APP_ID=your-app-id
GITHUB_INSTALLATION_ID=your-installation-id
GITHUB_APP_PRIVATE_KEY_B64=base64-encoded-key
```

**For Webhook (on Content Repository):**
```bash
# Webhook secret (configured in Content repo webhook settings)
GITHUB_WEBHOOK_SECRET=your-webhook-secret
```

## Current Code Configuration

### ✅ Correctly Configured
- GitHub sync service uses `GITHUB_CONTENT_REPO` variable
- Defaults to `'openKPIs-Content'` (should be set via env var to `'openKPIs-Content-Dev'`)
- All PRs are created in the content repository
- Webhook handler processes events from content repository

### ✅ Configuration
**Environment variables used:**
```bash
GITHUB_REPO_OWNER=devyendarm
GITHUB_CONTENT_REPO_NAME=openKPIs-Content-Dev
# OR
GITHUB_CONTENT_REPO=openKPIs-Content-Dev
```

This ensures PRs are created in the correct repository.

## Verification Checklist

- [ ] `GITHUB_CONTENT_REPO_NAME` or `GITHUB_CONTENT_REPO` is set to `openKPIs-Content-Dev`
- [ ] `GITHUB_REPO_OWNER` is set
- [ ] `GITHUB_APP_ID` is set
- [ ] `GITHUB_INSTALLATION_ID` is set
- [ ] `GITHUB_APP_PRIVATE_KEY_B64` is set
- [ ] GitHub App is installed on **OpenKPIs-Content-Dev** repository
- [ ] Webhook is configured on **OpenKPIs-Content-Dev** repository
- [ ] `GITHUB_WEBHOOK_SECRET` matches webhook secret in Content repo
- [ ] Test: Create item → PR created in Content repo
- [ ] Test: Merge PR → Webhook updates contribution status

## Summary

✅ **Code is correctly architected** for two repositories:
- App code → OpenKPIs-App-Dev
- Content PRs → OpenKPIs-Content-Dev
- Webhook → Configured on Content repo

Just ensure `GITHUB_CONTENT_REPO_NAME_DEV=openKPIs-Content-Dev` is set in your environment variables!

