# Vercel Environment Variables Update Guide

## Summary of Changes

We've updated the code to use **only** the new Supabase API keys:
- ✅ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (replaces `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- ✅ `SUPABASE_SECRET_KEY` (replaces `SUPABASE_SERVICE_ROLE_KEY`)

## Step-by-Step: Update Vercel Environment Variables

### Step 1: Access Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`openkpis-next` or similar)
3. Navigate to **Settings** → **Environment Variables**

### Step 2: Get New Keys from Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **API**

You'll see:
- **Project URL** → Use for `NEXT_PUBLIC_SUPABASE_URL`
- **Publishable key** → Use for `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- **Secret key** → Use for `SUPABASE_SECRET_KEY`

### Step 3: Update/Add Environment Variables in Vercel

#### Required Variables (Update These)

| Variable Name | Value Source | Environment |
|--------------|--------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → **Project URL** | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard → Settings → API → **Publishable key** | Production, Preview, Development |
| `SUPABASE_SECRET_KEY` | Supabase Dashboard → Settings → API → **Secret key** | Production, Preview (optional for dev) |

#### Optional: Remove Old Variables (If They Exist)

You can remove these if they exist (they're no longer used):
- ❌ `NEXT_PUBLIC_SUPABASE_ANON_KEY` (replaced by `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
- ❌ `SUPABASE_SERVICE_ROLE_KEY` (replaced by `SUPABASE_SECRET_KEY`)

**Note:** It's safe to keep them for now if you want, but they won't be used by the code.

### Step 4: Set Variables for Each Environment

For each variable, click **Add** or **Edit** and set:

1. **Key**: The variable name (e.g., `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
2. **Value**: The actual key value from Supabase
3. **Environment**: Select which environments to apply to:
   - ✅ **Production** (required)
   - ✅ **Preview** (recommended)
   - ✅ **Development** (optional, for local dev)

### Step 5: Verify All Variables Are Set

Check that you have these variables set:

**Required for Production:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [ ] `SUPABASE_SECRET_KEY`

**Optional but Recommended:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` (also set for Preview/Development)
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (also set for Preview/Development)

### Step 6: Redeploy

After updating environment variables:

1. Go to **Deployments** tab in Vercel
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger a new deployment

**Important:** Environment variable changes require a redeploy to take effect.

## Complete Environment Variables List

Here's the complete list of environment variables your app uses:

### Supabase (Required)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-secret-key
```

### GitHub (Required for Content Sync)
```
GITHUB_REPO_OWNER=devyendarm
GITHUB_CONTENT_REPO_NAME=openKPIs-Content
GITHUB_APP_ID=your-app-id
GITHUB_INSTALLATION_ID=your-installation-id
GITHUB_APP_PRIVATE_KEY_B64=your-base64-encoded-key
GITHUB_WEBHOOK_SECRET=your-webhook-secret
```

### GitHub (Client-Side - for UI links)
```
NEXT_PUBLIC_GITHUB_REPO_OWNER=devyendarm
NEXT_PUBLIC_GITHUB_CONTENT_REPO_NAME=openKPIs-Content
NEXT_PUBLIC_GITHUB_APP_REPO_NAME=openKPIs-App
```

### OpenAI (Optional - for AI features)
```
OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-5-mini
OPENAI_SERVICE_TIER=your-tier
```

### Giscus (Optional - for comments)
```
NEXT_PUBLIC_GISCUS_REPO=devyendarm/openKPIs-Content
NEXT_PUBLIC_GISCUS_REPO_ID=your-repo-id
NEXT_PUBLIC_GISCUS_CATEGORY=Q&A
NEXT_PUBLIC_GISCUS_CATEGORY_ID=your-category-id
```

## Quick Copy-Paste Checklist

**In Vercel Dashboard → Settings → Environment Variables, ensure these are set:**

### Supabase (NEW - Required)
```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  ← NEW (replaces ANON_KEY)
✅ SUPABASE_SECRET_KEY  ← NEW (replaces SERVICE_ROLE_KEY)
```

### Remove These (OLD - No Longer Used)
```
❌ NEXT_PUBLIC_SUPABASE_ANON_KEY  ← Can be removed
❌ SUPABASE_SERVICE_ROLE_KEY  ← Can be removed
```

## Troubleshooting

### Issue: "Missing env: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"

**Solution:**
1. Make sure you added `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (not `ANON_KEY`)
2. Check that it's set for the correct environment (Production)
3. Redeploy after adding the variable

### Issue: "Missing server admin envs: SUPABASE_SECRET_KEY"

**Solution:**
1. Make sure you added `SUPABASE_SECRET_KEY` (not `SERVICE_ROLE_KEY`)
2. Get the value from Supabase Dashboard → Settings → API → **Secret key**
3. Redeploy after adding the variable

### Issue: Variables not taking effect

**Solution:**
1. Environment variables require a redeploy to take effect
2. Go to Deployments → Redeploy
3. Or push a new commit

## Notes

- **No Compatibility Issues**: `publishable` and `secret` keys are functionally identical to `anon` and `service_role` keys - they're just renamed
- **Security**: `SUPABASE_SECRET_KEY` should only be used server-side (it's not prefixed with `NEXT_PUBLIC_`)
- **Public Keys**: `NEXT_PUBLIC_*` variables are exposed to the browser - safe for `PUBLISHABLE_KEY` but never expose `SECRET_KEY`

