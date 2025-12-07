# Why You're Getting 404 Error - Explained

## The Problem

You're seeing this error:
```
[GitHub Sync] User token commit failed: Error [HttpError]: Not Found
https://docs.github.com/rest/git/refs#create-a-reference
```

## Root Cause

**Your user token doesn't have `repo` scope**, so it can't access the repository.

## Why This Happens

### OAuth Apps Don't Have "Repo Access" Settings

**You're correct** - GitHub OAuth Apps don't have granular permissions like GitHub Apps do.

**GitHub OAuth Apps:**
- ❌ No "repo access" toggle in settings
- ❌ No permissions configuration page
- ✅ Request **scopes** (set in code)
- ✅ User grants scopes during authorization

**GitHub Apps (different):**
- ✅ Have granular permissions (Contents: Read & Write, etc.)
- ✅ Configured in app settings
- ✅ Installed on repositories

### How Scopes Work

1. **Code requests scopes:**
   ```typescript
   // lib/supabase/auth.ts - Line 58
   scopes: 'read:user user:email repo',  // ← Requests 'repo' scope
   ```

2. **User authorizes:**
   - GitHub shows: "Repositories: Public and private"
   - User grants permission
   - Token gets `repo` scope

3. **If user signed in BEFORE scope was added:**
   - Token doesn't have `repo` scope
   - Can't access repository → 404 error

## The Fix

### Step 1: Verify Code Has `repo` Scope

Check `lib/supabase/auth.ts` line 58:
```typescript
scopes: 'read:user user:email repo',  // ✅ Should have 'repo'
```

### Step 2: User Must Re-Authenticate

**The user who created the KPI must:**

1. **Sign out** completely from the app
2. **Sign back in** with GitHub
3. **Grant "Repositories: Public and private"** permission
4. This will add `repo` scope to their token

### Step 3: Verify Token Has Scope

After re-authenticating, check:
- Browser DevTools → Application → Cookies → `openkpis_github_token` (should exist)
- Create a new KPI
- Check logs for: `[GitHub Sync] Verified access to repository: devyendarm/OpenKPIs-Content-Dev`

## Why OAuth Apps Are Different

### OAuth Apps (What You're Using)
- **Settings page:** Just Client ID, Secret, Callback URL
- **No permissions:** Can't configure "repo access"
- **Scopes:** Requested in code, granted by user
- **User control:** User decides what to grant

### GitHub Apps (Different Thing)
- **Settings page:** Has granular permissions
- **Permissions:** Can configure "Contents: Read & Write"
- **Installation:** Installed on specific repositories
- **Admin control:** Admin configures permissions

## Summary

1. ✅ **OAuth App is correct** - No "repo access" setting is normal
2. ✅ **Code requests `repo` scope** - Already done (line 58)
3. ❌ **User token missing `repo` scope** - User signed in before scope was added
4. ✅ **Fix:** User must re-authenticate to get `repo` scope

The 404 error will go away once the user re-authenticates and grants the `repo` scope!

