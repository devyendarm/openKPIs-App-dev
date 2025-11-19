# GitHub Sync - Complete Setup Checklist

## ✅ Implementation Status

### Code Implementation
- ✅ GitHub sync service (`lib/services/github.ts`)
- ✅ Sync routes for all entity types (`/api/{entity}/[id]/sync-github`)
- ✅ Unified create route (`/api/items/create`)
- ✅ GitHub webhook handler (`/api/webhooks/github`)
- ✅ Editor edit permissions
- ✅ Contributor preservation

### What's Working
- ✅ Create new items → Creates PR
- ✅ Edit drafts (Owner/Editor) → Creates/updates PR
- ✅ Publish items (Editor) → Creates/updates PR
- ✅ Contribution records created
- ✅ Webhook updates contribution status

## 🔧 Required Environment Variables

### For GitHub Sync (Creating PRs)
These are required for the GitHub sync service to create PRs:

```bash
# GitHub App Credentials
GITHUB_APP_ID=your-app-id
GITHUB_INSTALLATION_ID=your-installation-id
GITHUB_APP_PRIVATE_KEY_B64=base64-encoded-key

# Repository Configuration
GITHUB_REPO_OWNER=your-github-username-or-org
GITHUB_CONTENT_REPO_NAME=your-repo-name
# OR
GITHUB_CONTENT_REPO=your-repo-name
```

### For GitHub Webhook (Updating Contribution Status)
```bash
GITHUB_WEBHOOK_SECRET=your-webhook-secret
```

## ✅ Verification Steps

### 1. Check Environment Variables
Verify all required variables are set in your deployment:
- Vercel: Project Settings → Environment Variables
- Local: `.env.local` file

### 2. Test GitHub Sync
1. Create a new item (e.g., `/kpis/new`)
2. Fill in the form and submit
3. Check:
   - ✅ Item created in Supabase
   - ✅ Contribution record created
   - ✅ PR created in GitHub repository
   - ✅ PR link stored in item record

### 3. Test Webhook
1. Merge a PR in GitHub
2. Check application logs for:
   ```
   [GitHub Webhook] Updated contribution status to 'completed' for item {id}
   ```
3. Verify in Supabase:
   - Contribution record `status` = `'completed'`

### 4. Test Editor Edit
1. As Editor, edit a draft item
2. Check:
   - ✅ Changes saved
   - ✅ `created_by` unchanged
   - ✅ `last_modified_by` = Editor
   - ✅ New PR created

## 🐛 Troubleshooting

### GitHub Sync Fails
**Error:** "GitHub credentials not configured"
- **Fix:** Set `GITHUB_APP_ID`, `GITHUB_INSTALLATION_ID`, and `GITHUB_APP_PRIVATE_KEY_B64`

**Error:** "Repository not found"
- **Fix:** Verify `GITHUB_REPO_OWNER` and `GITHUB_CONTENT_REPO_NAME` (or `GITHUB_CONTENT_REPO`) are correct

**Error:** "Installation not found"
- **Fix:** Verify GitHub App is installed on the repository
- Check `GITHUB_INSTALLATION_ID` is correct

### Webhook Not Working
**Error:** "Invalid signature"
- **Fix:** Ensure `GITHUB_WEBHOOK_SECRET` matches the secret in GitHub webhook settings

**Error:** Webhook not firing
- **Fix:** 
  - Check webhook is "Active" in GitHub
  - Verify URL is accessible
  - Check webhook delivery logs in GitHub

### PR Not Created
**Error:** PR creation fails silently
- **Fix:** Check application logs for GitHub API errors
- Verify GitHub App has write permissions
- Check branch name format is correct

## 📋 Quick Test Checklist

- [ ] Environment variables set (GitHub App credentials)
- [ ] GitHub App installed on repository
- [ ] Webhook configured in GitHub
- [ ] `GITHUB_WEBHOOK_SECRET` set in environment
- [ ] Test: Create new item → PR created
- [ ] Test: Edit draft → PR created/updated
- [ ] Test: Merge PR → Contribution status updated
- [ ] Test: Editor can edit drafts
- [ ] Test: Contributor preserved when Editor edits

## 🎯 Next Steps

Once all checks pass:
1. ✅ GitHub sync is fully functional
2. ✅ Contributions are tracked
3. ✅ Webhook updates status automatically
4. ✅ Ready for production use

No additional code changes needed - just ensure environment variables are configured correctly!

