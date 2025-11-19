# GitHub Sync Flow - Complete Documentation

## Overview

GitHub sync happens at three key points in the item lifecycle:
1. **Create** - When a contributor creates a new item
2. **Edit (Save All)** - When a contributor edits their draft
3. **Publish** - When an Admin/Editor publishes an item

## Current GitHub Sync Triggers

### 1. Create New Item (`/api/items/create`)
**Who:** Contributors (any signed-in user)  
**When:** Creating new KPI, Metric, Dimension, Event, or Dashboard  
**Action:** `'created'`  
**What happens:**
- Item created in Supabase with `status: 'draft'`
- Contribution record created with `status: 'pending'`
- GitHub PR created immediately
- PR title: `Add {type}: {name}`
- PR body includes: `**Contributed by**: @{username}`

**Code:** `app/api/items/create/route.ts` → calls `syncToGitHub({ action: 'created' })`

### 2. Edit Draft Item (Save All)
**Who:** Draft owner OR Editor/Admin  
**When:** Owner or Editor clicks "Save All" on a draft item's edit page  
**Action:** `'edited'`  
**What happens:**
- Item updated in Supabase (remains `status: 'draft'`)
- `created_by` remains unchanged (original contributor preserved)
- `last_modified_by` updated to current user (Editor if Editor edited, Owner if Owner edited)
- `last_modified_at` updated to current timestamp
- GitHub PR created/updated
- PR title: `Update {type}: {name}`
- PR body includes:
  - `**Contributed by**: @{original_contributor}` (always shows original creator)
  - `**Edited by**: @{editor}` (only shown if Editor edited, different from contributor)
- PR author: Current user (Editor if Editor edited, Owner if Owner edited)

**Code:** `app/(content)/{entity}/[slug]/edit/{Entity}EditClient.tsx` → calls `/api/{entity}/{id}/sync-github` with `action: 'edited'`

**Permissions:**
- Draft owners can edit their drafts
- Editors/Admins can edit any draft
- Published items cannot be edited via edit pages (redirects to "Edit unavailable")

### 3. Editor Publish (`/api/editor/publish`)
**Who:** Admin or Editor only  
**When:** Publishing a draft item from the Editor Review page  
**Action:** `'edited'`  
**What happens:**
- Item status changed to `'published'` in Supabase
- `created_by` remains unchanged (original contributor preserved)
- `last_modified_by` updated to Editor/Admin who published
- `last_modified_at` updated to current timestamp
- GitHub PR created/updated
- PR title: `Update {type}: {name}`
- PR body includes:
  - `**Contributed by**: @{original_contributor}` (always shows original creator)
  - `**Edited by**: @{editor}` (shows Editor/Admin who published, if different from contributor)
- PR author: Editor/Admin who published

**Code:** `app/api/editor/publish/route.ts` → calls `/api/{entity}/{id}/sync-github` with `action: 'edited'`

**Permissions:**
- Only Admin/Editor roles can publish
- Uses `getUserRoleServer()` to check role

## Current Limitations

### ❌ Missing Features

1. **No Post-Publish Editing**
   - Published items cannot be edited via edit pages
   - Edit pages check: `!isOwner || status !== DRAFT` → blocks all published items
   - Admin/Editor cannot edit published items directly (only via Editor page, which publishes)

2. **No Versioning**
   - Each edit creates a new PR, but there's no version tracking
   - No history of changes
   - No way to track "different versions" as mentioned

3. **No Contribution Status Updates**
   - Contribution records stay `'pending'` forever
   - No webhook to update status when PR is merged/closed
   - Leaderboard counts all contributions as pending

4. **Editor/Admin Rights**
   - ✅ Editors/Admins can edit any draft via edit pages
   - ✅ Editors/Admins can publish items via Editor Review page
   - ✅ When Editor edits, `created_by` stays the same (contributor preserved)
   - ✅ When Editor edits, `last_modified_by` is updated to Editor
   - ❌ Editors/Admins CANNOT edit published items via edit pages (same restriction as contributors)

## GitHub PR Flow

### PR Creation
- **Branch:** `{action}-{tableName}-{slug}-{timestamp}`
- **Base:** `main`
- **File Path:** `data-layer/{tableName}/{slug}.yml`
- **Author:** User's GitHub username (from `user_metadata.user_name`)
- **Committer:** OpenKPIs Bot

### PR Updates
- If PR already exists for the item, it updates the existing PR
- Each `syncToGitHub` call creates a new branch and PR
- Multiple PRs can exist for the same item (one per edit)

## Contribution Tracking

### Contribution Record Structure
```typescript
{
  user_id: string,        // Contributor's user ID
  item_type: string,      // 'kpi' | 'metric' | 'dimension' | 'event' | 'dashboard'
  item_id: string,        // Item's database ID
  item_slug: string,      // Item's URL slug
  action: 'created',      // Always 'created' for new items
  status: 'pending',      // Never updates (missing webhook)
  created_at: string
}
```

### What Gets Tracked
- ✅ All new item creations
- ✅ User attribution in PR body
- ✅ PR link stored in item record
- ❌ Contribution status never updates
- ❌ No tracking of edits (only creates)
- ❌ No tracking of publishes

## Recommended Enhancements

### 1. GitHub Webhook Handler ✅ COMPLETED
**Purpose:** Update contribution status when PRs are merged/closed

**Endpoint:** `/api/webhooks/github`

**Status:** ✅ **IMPLEMENTED**

**Events handled:**
- ✅ `pull_request.closed` (merged) → Updates contribution `status: 'completed'`
- ✅ `pull_request.closed` (not merged) → Updates contribution `status: 'failed'`

**Features:**
- ✅ Webhook signature verification (HMAC SHA-256)
- ✅ Extracts item info from PR branch name
- ✅ Updates contribution records in Supabase
- ✅ Updates item's GitHub PR number and URL when merged
- ✅ Error handling and logging

**Setup Required:**
1. Configure webhook in GitHub repository:
   - Settings → Webhooks → Add webhook
   - Payload URL: `https://your-domain.com/api/webhooks/github`
   - Content type: `application/json`
   - Events: Select **"Let me select individual events"** → Check **"Pull requests"**
   - Secret: Enter a secure random string (save this for step 2)

2. Set environment variable:
   ```bash
   GITHUB_WEBHOOK_SECRET=your-secret-key
   ```
   - In Vercel: Project Settings → Environment Variables
   - In local: Add to `.env.local`

**See `GITHUB_WEBHOOK_SETUP.md` for detailed step-by-step instructions.**

### 2. Admin Edit Published Items (MEDIUM PRIORITY)
**Purpose:** Allow Admin/Editor to edit published items

**Changes needed:**
- Update edit page checks to allow Admin/Editor for published items
- Create separate contribution record for edits
- Track who made the edit (original creator vs editor)

### 3. Version Tracking (LOW PRIORITY)
**Purpose:** Track different versions of items

**Changes needed:**
- Add version field to items
- Create version history table
- Link PRs to versions

@