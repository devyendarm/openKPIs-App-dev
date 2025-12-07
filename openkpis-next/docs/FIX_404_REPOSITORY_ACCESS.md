# Fix: 404 Error When Creating GitHub Branch

## Error Message

```
[GitHub Sync] User token commit failed: Error [HttpError]: Not Found
https://docs.github.com/rest/git/refs#create-a-reference
```

## Root Cause

The user's OAuth token doesn't have access to the repository, or the repository doesn't exist.

## Possible Causes

### 1. User Token Doesn't Have `repo` Scope

**Symptoms:**
- 404 error when trying to create branch
- User signed in before `repo` scope was added

**Fix:**
1. User must **sign out and sign back in**
2. Grant **"Repositories: Public and private"** permission
3. This will grant the `repo` scope

### 2. Repository Name Mismatch

**Check Environment Variables:**
- `GITHUB_REPO_OWNER` should be: `devyendarm` (or your org)
- `GITHUB_CONTENT_REPO_NAME` should be: `OpenKPIs-Content-Dev` (exact case)

**Verify in Vercel:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Check:
   - `GITHUB_REPO_OWNER=devyendarm`
   - `GITHUB_CONTENT_REPO_NAME=OpenKPIs-Content-Dev`

**Note:** Repository name is case-sensitive!

### 3. User Not a Collaborator (Private Repo)

If the repository is private, the user must be:
- A collaborator on the repository, OR
- The repository owner, OR
- Part of an organization with access

**Fix:**
1. Go to GitHub repository: `https://github.com/devyendarm/OpenKPIs-Content-Dev`
2. Settings → Collaborators
3. Add the user as a collaborator

### 4. Repository Doesn't Exist

**Check:**
- Does `https://github.com/devyendarm/OpenKPIs-Content-Dev` exist?
- Is the repository name spelled correctly?

## Verification Steps

### Step 1: Check Repository Access

1. Go to: `https://github.com/devyendarm/OpenKPIs-Content-Dev`
2. Can you see the repository?
3. If private, are you a collaborator?

### Step 2: Check User Token Scopes

1. Sign in to your app
2. Check browser DevTools → Application → Cookies → `openkpis_github_token`
3. If token exists, it should have `repo` scope (if you signed in after scope was added)

### Step 3: Re-authenticate

1. **Sign out** completely from the app
2. **Sign back in** with GitHub
3. **Grant all permissions** when prompted:
   - ✅ Repositories: Public and private
   - ✅ Read all user profile data
   - ✅ Access user email addresses (read-only)
4. Try creating a KPI again

### Step 4: Check Server Logs

After re-authenticating, create a KPI and check logs for:

**Good:**
```
[GitHub Sync] Verified access to repository: devyendarm/OpenKPIs-Content-Dev
```

**Bad:**
```
Repository not found or no access: devyendarm/OpenKPIs-Content-Dev
```

## Quick Fix

**Most Common Solution:**

1. **User must re-authenticate:**
   - Sign out
   - Sign back in
   - Grant "Repositories: Public and private" permission

2. **Verify environment variables in Vercel:**
   - `GITHUB_REPO_OWNER=devyendarm`
   - `GITHUB_CONTENT_REPO_NAME=OpenKPIs-Content-Dev`

3. **Check repository exists and user has access:**
   - Visit: `https://github.com/devyendarm/OpenKPIs-Content-Dev`
   - Ensure you can see it (if private, you must be a collaborator)

## Code Improvements

The code now includes better error messages:
- Verifies repository access before attempting operations
- Provides specific error messages for 404 errors
- Logs repository name for debugging

## After Fix

Once fixed, you should see in logs:
```
[GitHub Sync] Verified access to repository: devyendarm/OpenKPIs-Content-Dev
[GitHub Sync] Authenticating with user OAuth token.
```

And the commit should succeed!

