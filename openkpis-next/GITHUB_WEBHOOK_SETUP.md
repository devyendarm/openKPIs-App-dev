# GitHub Webhook Setup Instructions

## Step-by-Step Configuration

### 1. Navigate to Webhook Settings
- Go to your GitHub repository
- Click **Settings** → **Webhooks** → **Add webhook**

### 2. Configure Webhook URL
- **Payload URL**: `https://your-domain.com/api/webhooks/github`
  - Replace `your-domain.com` with your actual domain (e.g., `dev.openkpis.org` or `openkpis.org`)
- **Content type**: Select `application/json`

### 3. Select Events
When you see the options:
- ❌ **Just the push event** - Don't select this
- ❌ **Send me everything** - Don't select this (too many events)
- ✅ **Let me select individual events** - **SELECT THIS**

### 4. Choose Individual Events
After selecting "Let me select individual events", check the following:

**Required:**
- ✅ **Pull requests** - This is the main event we need

**Optional (for future enhancements):**
- ⬜ Pull request review
- ⬜ Pull request review comment
- ⬜ Issues
- ⬜ Issue comment

**For now, you only need:**
- ✅ **Pull requests** (checked)

### 5. Set Secret
- **Secret**: Enter a secure random string (e.g., generate with `openssl rand -hex 32`)
- **Important**: Save this secret - you'll need it for the environment variable

### 6. Configure Environment Variable
Set the secret in your deployment environment:

**Vercel:**
- Go to Project Settings → Environment Variables
- Add: `GITHUB_WEBHOOK_SECRET` = `your-secret-value`

**Local Development (.env.local):**
```bash
GITHUB_WEBHOOK_SECRET=your-secret-value
```

### 7. Activate Webhook
- ✅ Check "Active" (should be checked by default)
- Click **Add webhook**

## What Events Are Processed

The webhook handler listens for:
- **Event Type**: `pull_request`
- **Action**: `closed` (when PR is merged or closed)

When a PR is:
- **Merged** → Contribution status updated to `'completed'`
- **Closed (not merged)** → Contribution status updated to `'failed'`

## Testing the Webhook

After setup:
1. Create a test PR in your repository
2. Merge or close the PR
3. Check your application logs for:
   ```
   [GitHub Webhook] Updated contribution status to 'completed' for item {id} (PR #{number})
   ```
4. Verify in Supabase that the contribution record's `status` field has been updated

## Troubleshooting

### Webhook Not Firing
- Check webhook delivery logs in GitHub (Settings → Webhooks → Your webhook → Recent Deliveries)
- Verify the URL is accessible (should return `{"received": true}`)
- Check that `GITHUB_WEBHOOK_SECRET` is set correctly

### Invalid Signature Error
- Ensure `GITHUB_WEBHOOK_SECRET` matches the secret configured in GitHub
- Check that the secret doesn't have extra spaces or newlines

### Item Not Found
- Verify the PR branch name follows the format: `{action}-{tableName}-{slug}-{timestamp}`
- Check that the item exists in Supabase with the correct slug

