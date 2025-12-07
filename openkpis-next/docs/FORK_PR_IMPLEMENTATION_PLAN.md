# Fork + PR Implementation Plan

## Overview

Implementing a hybrid GitHub contribution system:
- **Quick Create (default)**: App-based sync, no GitHub contributions for users
- **Advanced: Fork + PR (opt-in)**: User fork + PR for real GitHub contributions

## Implementation Steps

### Phase 1: Database Schema ✅
- [x] Add `enable_github_fork_contributions` boolean column to `user_profiles`
- [x] Default: `false` (Quick Create by default)

### Phase 2: Backend - GitHub Service
- [ ] Add `GitHubContributionMode` type: `'internal_app' | 'fork_pr' | 'editor_direct'`
- [ ] Implement `getUserContributionMode(userId)` helper
- [ ] Implement `syncViaForkAndPR()` function:
  - Ensure fork exists (create + poll if needed)
  - Get base SHA from org repo main
  - Create branch in fork
  - Commit file to fork branch
  - Open PR from fork → org repo
- [ ] Update `syncToGitHub()` to support mode selection

### Phase 3: Backend - API Routes
- [ ] Create `/api/user/settings/github-contributions` (POST) to toggle preference
- [ ] Update `/api/items/create` to:
  - Check user preference
  - Determine mode
  - Pass mode to `syncToGitHub()`
  - Handle fork+PR specific responses

### Phase 4: Frontend
- [ ] Update `useItemForm.ts`:
  - Show "Quick Create" as primary button
  - Show "Advanced: Create with GitHub Fork + PR" as secondary option
  - First-time modal explanation
  - Remember user preference
- [ ] Add user settings UI (optional, for later)

### Phase 5: Testing & Documentation
- [ ] Test Quick Create (should work as before)
- [ ] Test Fork+PR flow end-to-end
- [ ] Update documentation
- [ ] Add feature flag `GITHUB_FORK_MODE_ENABLED`

## Files to Modify

1. **Database:**
   - `supabase/migrations/add_github_fork_preference.sql` (NEW)

2. **Backend:**
   - `lib/services/github.ts` (UPDATE)
   - `app/api/items/create/route.ts` (UPDATE)
   - `app/api/user/settings/github-contributions/route.ts` (NEW)

3. **Frontend:**
   - `hooks/useItemForm.ts` (UPDATE)
   - Create form components (UPDATE)

4. **Config:**
   - `.env.local` (add `GITHUB_FORK_MODE_ENABLED=true`)

## Key Design Decisions

1. **Mode Selection Logic:**
   - If `enable_github_fork_contributions = true` AND user has valid token → `fork_pr`
   - Else → `internal_app` (current behavior)

2. **Fork Lifecycle:**
   - Check if fork exists on every operation
   - Create fork if missing (with polling for first-time)
   - Cache fork existence in user_profiles (optional optimization)

3. **Error Handling:**
   - Fork creation failure → fallback to `internal_app` mode
   - PR creation failure → return partial success (commit exists, PR failed)
   - Always create item in Supabase (GitHub is non-blocking)

4. **User Experience:**
   - Default: Simple "Quick Create" (no GitHub complexity)
   - Advanced: Clear explanation modal on first use
   - Remember preference per user

