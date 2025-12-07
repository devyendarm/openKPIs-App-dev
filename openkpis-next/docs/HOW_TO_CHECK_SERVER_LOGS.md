# How to Check Server Logs for GitHub Contributions

## Where to Find Logs

### Option 1: Vercel (Production)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project: `openkpis-next` (or your project name)

2. **Navigate to Logs**
   - Click on your project
   - Go to **"Deployments"** tab
   - Click on the latest deployment
   - Click **"Functions"** tab
   - Click on any function (e.g., `/api/items/create`)
   - Click **"View Function Logs"** or **"Logs"** tab

3. **Real-time Logs (Better)**
   - Go to **"Logs"** tab in Vercel dashboard
   - Select your project
   - Filter by function: `/api/items/create`
   - Watch logs in real-time while creating a KPI

### Option 2: Local Development

1. **Terminal where you run `npm run dev`**
   - Logs appear directly in the terminal
   - Look for messages starting with `[GitHub Token]` or `[GitHub Sync]`

2. **Browser Console** (for client-side logs)
   - Open DevTools (F12)
   - Go to **Console** tab
   - Look for any error messages

## What Log Messages to Look For

### ✅ GOOD - User Token is Being Used

When you create a KPI, you should see these messages in order:

```
[GitHub Token] Found token in cookie
[GitHub Token] Token is valid
[GitHub Sync] Authenticating with user OAuth token.
```

**OR**

```
[GitHub Token] Found token in user_metadata
[GitHub Token] Token is valid
[GitHub Sync] Authenticating with user OAuth token.
```

**Result**: Commit will count toward your contributions ✅

### ❌ BAD - Bot Token is Being Used

If you see these messages:

```
[GitHub Token] GitHub token not found. Please sign in with GitHub.
[GitHub Sync] All user token attempts failed, using bot as last resort
[GitHub Sync] Used bot token as last resort - commit will NOT count toward user contributions
```

**OR**

```
[GitHub Token] Token expired, attempting silent refresh...
[GitHub Token] Silent refresh failed
[GitHub Sync] All user token attempts failed, using bot as last resort
```

**Result**: Commit will NOT count toward your contributions ❌

### ⚠️ WARNING - Token Issues

If you see:

```
[GitHub Token] Token expired, attempting silent refresh...
[GitHub Token] Silent refresh successful
[GitHub Sync] Authenticating with user OAuth token.
```

**Result**: Token was refreshed, commit will count ✅

## Step-by-Step: How to Check Logs

### Method 1: Vercel Dashboard (Recommended for Production)

1. **Create a test KPI**
   - Go to your deployed site
   - Create a new KPI
   - Click "Save"

2. **Open Vercel Logs**
   - Go to: https://vercel.com/dashboard
   - Select your project
   - Click **"Logs"** tab
   - Filter by: `api/items/create`

3. **Look for log messages**
   - Scroll to find messages with `[GitHub Token]` or `[GitHub Sync]`
   - Check if user token or bot token was used

### Method 2: Local Development

1. **Start dev server**
   ```bash
   npm run dev
   ```

2. **Watch the terminal**
   - Keep terminal visible
   - Create a new KPI in browser

3. **Check terminal output**
   - Look for `[GitHub Token]` messages
   - Check if token was found and used

### Method 3: Check Specific Log Points

The code logs at these points:

**File**: `lib/services/github.ts`
- Line 95: `[GitHub Token] Found token in cookie`
- Line 105: `[GitHub Token] Found token in user_metadata`
- Line 125: `[GitHub Token] Token is valid`
- Line 130: `[GitHub Token] Token expired, attempting silent refresh...`
- Line 138: `[GitHub Token] Silent refresh successful`
- Line 200: `[GitHub Sync] Authenticating with user OAuth token.`
- Line 463: `[GitHub Sync] All user token attempts failed, using bot as last resort`
- Line 407: `[GitHub Sync] Used bot token as last resort - commit will NOT count toward user contributions`

## Example: Good Log Output

```
[GitHub Token] Found token in cookie
[GitHub Token] Token is valid
[GitHub Sync] Authenticating with user OAuth token.
[Create Item] Using cached verified email: user@example.com
[GitHub Sync] Successfully created PR #123
```

## Example: Bad Log Output

```
[GitHub Token] GitHub token not found. Please sign in with GitHub.
[GitHub Sync] All user token attempts failed, using bot as last resort
[GitHub Sync] Used bot token as last resort - commit will NOT count toward user contributions
[GitHub Sync] Successfully created PR #123
```

## Troubleshooting Based on Logs

### If you see "Token not found"
- **Fix**: Sign out and sign back in
- **Check**: Cookie `openkpis_github_token` exists in browser

### If you see "Token expired"
- **Fix**: Sign out and sign back in
- **Check**: Token expiration time in user_metadata

### If you see "Bot token used"
- **Fix**: Re-authenticate to get user token
- **Check**: Server logs to see why user token wasn't used

## Quick Test

1. **Create a test KPI**
2. **Immediately check logs** (Vercel or local terminal)
3. **Look for**: `[GitHub Sync] Authenticating with user OAuth token.`
4. **If you see it**: ✅ Token is being used, contributions should count
5. **If you don't see it**: ❌ Bot is being used, need to re-authenticate

