# GitHub Fork + PR Implementation

## Overview

This implementation adds a **hybrid GitHub contribution system** with two modes:

1. **Quick Create (default)**: App-based sync, no GitHub contributions for users
2. **Advanced: Fork + PR (opt-in)**: User fork + PR for real GitHub contributions

## Architecture

### Modes

- **`internal_app`**: Current behavior - GitHub App commits to org repo (no user contributions)
- **`fork_pr`**: New mode - User fork + PR workflow (real GitHub contributions)

### Flow

#### Quick Create (internal_app)
1. User creates KPI → Backend uses GitHub App
2. App commits to org repo (draft folder or branch+PR)
3. ✅ KPI created, ✅ Content synced
4. ❌ No GitHub contributions for user

#### Fork + PR (fork_pr)
1. User enables "GitHub Contributions" preference
2. User creates KPI → Backend checks preference
3. Backend ensures fork exists (creates if needed)
4. Backend creates branch in fork
5. Backend commits file to fork (using user token)
6. Backend opens PR from fork → org repo
7. ✅ KPI created, ✅ Content synced, ✅ **Real GitHub contributions**

## Database Changes

### Migration Required

Run this SQL in Supabase SQL Editor (replace `{prefix}` with your table prefix):

```sql
ALTER TABLE {prefix}_user_profiles
ADD COLUMN IF NOT EXISTS enable_github_fork_contributions BOOLEAN DEFAULT false;
```

**File:** `scripts/add_github_fork_preference.sql`

## Environment Variables

### Required

Add to `.env.local` and Vercel:

```bash
# Enable fork+PR mode (feature flag)
GITHUB_FORK_MODE_ENABLED=true
```

**Note:** If `false` or not set, all users use `internal_app` mode regardless of preference.

## API Endpoints

### Toggle User Preference

**POST** `/api/user/settings/github-contributions`

```json
{
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "enabled": true,
  "message": "GitHub fork contributions enabled..."
}
```

**GET** `/api/user/settings/github-contributions`

**Response:**
```json
{
  "enabled": false
}
```

## Code Changes

### Backend

1. **`lib/services/github.ts`**:
   - Added `GitHubContributionMode` type
   - Added `getUserContributionMode()` helper
   - Added `syncViaForkAndPR()` function
   - Updated `syncToGitHub()` to support mode selection

2. **`app/api/items/create/route.ts`**:
   - Checks user preference before calling `syncToGitHub()`
   - Passes `mode` parameter to `syncToGitHub()`

3. **`app/api/user/settings/github-contributions/route.ts`** (NEW):
   - POST: Toggle user preference
   - GET: Retrieve user preference

### Frontend (TODO)

- Update `hooks/useItemForm.ts` to show:
  - Primary: "Quick Create" button
  - Secondary: "Create with GitHub Fork + PR" option
  - First-time explanation modal

## Fork Creation Flow

1. **Check if fork exists**: `GET /repos/{userLogin}/{repoName}`
2. **If 404**: Create fork via `POST /repos/{owner}/{repo}/forks`
3. **Poll for fork** (max 10 seconds, 500ms intervals)
4. **Once ready**: Continue with branch creation

## Error Handling

- **Fork creation fails**: Falls back to `internal_app` mode (non-blocking)
- **PR creation fails**: Returns partial success (commit exists, PR failed)
- **Token missing/invalid**: Requires re-authentication

## Testing

### Test Quick Create (Default)
1. Ensure `enable_github_fork_contributions = false` in user profile
2. Create KPI → Should use App-based sync
3. Verify no fork created in user's GitHub

### Test Fork + PR
1. Enable preference: `POST /api/user/settings/github-contributions` with `enabled: true`
2. Create KPI → Should:
   - Create/ensure fork exists
   - Create branch in fork
   - Commit file to fork
   - Open PR to org repo
3. Verify fork exists: `github.com/{userLogin}/{CONTENT_REPO}`
4. Verify PR exists in org repo
5. Verify contributions appear on user's GitHub profile (after PR merge)

## Benefits

### For Users
- ✅ Real GitHub contributions (green squares)
- ✅ Fork count increases
- ✅ Professional PR workflow
- ✅ Public contribution history

### For Org Repo
- ✅ Fork count increases
- ✅ Contributor metrics increase
- ✅ Professional open-source workflow
- ✅ Review process for all contributions

### For EB1A
- ✅ Real GitHub metrics (forks, contributors, contributions)
- ✅ Professional open-source project evidence
- ✅ Community engagement metrics

## Security

- ✅ No automatic collaborator granting
- ✅ Users only have write access to their own forks
- ✅ Org repo stays protected
- ✅ All PRs go through review process

## Next Steps

1. ✅ Backend implementation (DONE)
2. ⏳ Frontend UI updates (TODO)
3. ⏳ Webhook handler updates for fork PRs (TODO)
4. ⏳ Documentation updates (IN PROGRESS)

