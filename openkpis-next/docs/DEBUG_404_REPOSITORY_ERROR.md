# Debug: 404 Error When Creating Branch

## Consolidated Facts

✅ **Code has `repo` scope:** `scopes: 'read:user user:email repo'` (lib/supabase/auth.ts line 58)  
✅ **User granted permissions:** "Repositories: Public and private" shown on OAuth page  
✅ **Fresh login:** User just signed in, so token should have `repo` scope  
❌ **Still getting 404:** Error when trying to create branch

## Actual Error

```
[GitHub Sync] User token commit failed: Error [HttpError]: Not Found
https://docs.github.com/rest/git/refs#create-a-reference
```

This happens at: `octokit.git.createRef()` - trying to create a branch.

## Possible Causes (Not Scope Related)

### 1. Repository Name Mismatch

**Check Vercel Environment Variables:**
- `GITHUB_REPO_OWNER` should be: `devyendarm`
- `GITHUB_CONTENT_REPO_NAME` should be: `OpenKPIs-Content-Dev` (exact case)

**Code uses:**
```typescript
const GITHUB_OWNER = process.env.GITHUB_REPO_OWNER || 'devyendarm';
const GITHUB_CONTENT_REPO = process.env.GITHUB_CONTENT_REPO_NAME || process.env.GITHUB_CONTENT_REPO || 'openKPIs-Content';
```

**Issue:** If `GITHUB_CONTENT_REPO` is set to `devyendarm/OpenKPIs-Content-Dev` (with owner), the code might use it incorrectly.

**Fix:** Ensure `GITHUB_CONTENT_REPO_NAME=OpenKPIs-Content-Dev` (without owner) is set in Vercel.

### 2. Repository Case Sensitivity

GitHub repository names are case-sensitive:
- ✅ `OpenKPIs-Content-Dev` (correct)
- ❌ `openKPIs-Content-Dev` (wrong case)
- ❌ `openkpis-content-dev` (wrong case)

**Check:** Does `https://github.com/devyendarm/OpenKPIs-Content-Dev` exist with exact case?

### 3. User Not a Collaborator (Private Repo)

Even with `repo` scope, if the repository is **private**, the user must be:
- A collaborator on the repository, OR
- The repository owner

**Check:**
1. Is `OpenKPIs-Content-Dev` a private repository?
2. Is the user a collaborator? Go to: `https://github.com/devyendarm/OpenKPIs-Content-Dev/settings/access`

### 4. Repository Doesn't Exist

**Verify:** Does `https://github.com/devyendarm/OpenKPIs-Content-Dev` actually exist?

## Debug Steps

### Step 1: Check What Repository Name is Being Used

Add logging to see what values are being used:

```typescript
console.log('[DEBUG] GITHUB_OWNER:', GITHUB_OWNER);
console.log('[DEBUG] GITHUB_CONTENT_REPO:', GITHUB_CONTENT_REPO);
console.log('[DEBUG] Attempting to access:', `${GITHUB_OWNER}/${GITHUB_CONTENT_REPO}`);
```

### Step 2: Check Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify:
   - `GITHUB_REPO_OWNER=devyendarm`
   - `GITHUB_CONTENT_REPO_NAME=OpenKPIs-Content-Dev` (exact case, no owner prefix)

### Step 3: Test Repository Access

The code now verifies repository access first. Check logs for:
```
[GitHub Sync] Verified access to repository: devyendarm/OpenKPIs-Content-Dev
```

If you see an error here, that's the issue.

### Step 4: Check Repository Settings

1. Go to: `https://github.com/devyendarm/OpenKPIs-Content-Dev`
2. Check:
   - Does it exist?
   - Is it private or public?
   - Is the user a collaborator? (Settings → Collaborators)

## Most Likely Issue

Given that:
- ✅ Scope is correct
- ✅ User granted permissions
- ✅ Fresh login

The issue is likely:
1. **Repository name mismatch** in Vercel environment variables
2. **User not a collaborator** on private repository
3. **Case sensitivity** in repository name

## Quick Fix

1. **Check Vercel env vars:**
   - `GITHUB_REPO_OWNER=devyendarm`
   - `GITHUB_CONTENT_REPO_NAME=OpenKPIs-Content-Dev` (exact case)

2. **If repository is private:**
   - Add user as collaborator: `https://github.com/devyendarm/OpenKPIs-Content-Dev/settings/access`

3. **Check logs** for the actual repository name being used

