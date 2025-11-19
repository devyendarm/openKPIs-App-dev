# GitHub Sync Functionality - Summary

## Answer to Your Questions

### Q1: Is GitHub sync limited to Create/Edit (Save All) or does Editor Publish also sync?

**Answer: GitHub sync happens in ALL THREE scenarios:**

1. ✅ **Create** - When contributor creates new item → `action: 'created'`
2. ✅ **Edit (Save All)** - When contributor edits their draft → `action: 'edited'`
3. ✅ **Editor Publish** - When Admin/Editor publishes → `action: 'edited'`

### Q2: What about different versions, post-publish modifications, and Admin rights?

**Current State:**

#### ✅ What Works:
- **Create:** Contributors create items → PR created
- **Edit Draft:** Draft owners OR Editors/Admins can edit → PR created/updated
  - `created_by` preserved (original contributor)
  - `last_modified_by` updated (Editor if Editor edited)
- **Publish:** Admin/Editor publish → PR created/updated
  - `created_by` preserved (original contributor)
  - `last_modified_by` updated (Editor who published)
- **Editor/Admin Rights:** 
  - ✅ Can edit any draft via edit pages
  - ✅ Can publish items via Editor Review page
  - ✅ Contributor attribution preserved in GitHub PRs

#### ❌ What's Missing:
- **Post-Publish Editing:** Published items cannot be edited via edit pages (even by Admin)
- **Version Tracking:** No versioning system exists
- **Contribution Status Updates:** Status stays `'pending'` forever (now fixed with webhook)

## Complete GitHub Sync Flow

### 1. Create New Item
```
User creates item → /api/items/create
  ├─ Creates item (status: 'draft')
  ├─ Creates contribution (status: 'pending')
  └─ syncToGitHub(action: 'created')
      └─ Creates PR: "Add {type}: {name}"
```

### 2. Edit Draft (Save All)
```
Owner OR Editor clicks "Save All" → EditClient
  ├─ Updates item (stays 'draft')
  ├─ created_by: unchanged (preserves original contributor)
  ├─ last_modified_by: updated to current user
  └─ Calls /api/{entity}/{id}/sync-github
      └─ syncToGitHub(action: 'edited')
          ├─ PR author: current user (Editor if Editor edited)
          └─ PR body: "Contributed by: @{original}" + "Edited by: @{editor}" (if different)
```

### 3. Editor Publish
```
Admin/Editor publishes → /api/editor/publish
  ├─ Updates item (status: 'published')
  ├─ created_by: unchanged (preserves original contributor)
  ├─ last_modified_by: updated to Editor/Admin
  └─ Calls /api/{entity}/{id}/sync-github
      └─ syncToGitHub(action: 'edited')
          ├─ PR author: Editor/Admin who published
          └─ PR body: "Contributed by: @{original}" + "Edited by: @{editor}" (if different)
```

### 4. Post-Publish Modifications (NOT CURRENTLY SUPPORTED)
```
❌ Published items cannot be edited via edit pages
❌ Edit pages check: !isOwner || status !== DRAFT
❌ This blocks ALL users (including Admin) from editing published items
```

## Editor/Admin Rights

### What Editor/Admin CAN Do:
- ✅ Edit any draft item via edit pages (preserves original contributor)
- ✅ Publish any draft item (via Editor Review page)
- ✅ View all items (draft and published)
- ✅ Access Editor Review page
- ✅ Contributor attribution preserved in GitHub PRs

### What Editor/Admin CANNOT Do:
- ❌ Edit published items via edit pages (same restriction as contributors)
- ❌ Edit published items directly (would need to use Editor page, which publishes)

## New Feature: GitHub Webhook Handler

### What It Does:
- Listens for GitHub PR events
- Updates contribution status when PR is merged/closed
- Status changes: `'pending'` → `'completed'` (merged) or `'failed'` (closed)

### Setup Required:
1. Configure webhook in GitHub repository:
   - Settings → Webhooks → Add webhook
   - Payload URL: `https://your-domain.com/api/webhooks/github`
   - Content type: `application/json`
   - Secret: Set `GITHUB_WEBHOOK_SECRET` environment variable
   - Events: Select "Pull requests"

2. Set environment variable:
   ```bash
   GITHUB_WEBHOOK_SECRET=your-secret-key
   ```

### How It Works:
```
PR Merged/Closed → GitHub sends webhook
  └─ /api/webhooks/github
      ├─ Verifies signature
      ├─ Extracts item info from branch name
      ├─ Finds item by slug
      └─ Updates contribution status
          ├─ merged → status: 'completed'
          └─ closed (not merged) → status: 'failed'
```

## Recommendations

### High Priority:
1. ✅ **GitHub Webhook** - DONE (created `/api/webhooks/github`)
2. ⚠️ **Admin Edit Published Items** - Needs implementation
   - Update edit page checks to allow Admin/Editor for published items
   - Create contribution record for edits
   - Track who made the edit

### Medium Priority:
3. **Version Tracking** - Future enhancement
   - Add version field to items
   - Create version history table
   - Link PRs to versions

### Low Priority:
4. **Edit Contribution Tracking** - Track edits separately from creates
   - Currently only "created" actions are tracked
   - Could add "edited" contribution records

