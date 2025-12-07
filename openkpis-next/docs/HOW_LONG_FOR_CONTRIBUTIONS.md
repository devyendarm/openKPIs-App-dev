# How Long to Wait for GitHub Contributions to Show Up

## ⚠️ Critical: PR Must Be Merged to Main

**GitHub contributions only count when:**
1. ✅ The PR is **merged to the default branch (main)**, OR
2. ✅ The commit is directly on the main branch

**Commits on feature branches (like `created-kpis-...`) do NOT count until the PR is merged.**

---

## Timeline

### Normal Timeline
- **PR merged** → **1-5 minutes** → Contribution appears
- **Usually:** Within 1-5 minutes after merge
- **Rare cases:** Up to 24 hours (GitHub processing delay)

### If PR is Not Merged
- **PR still open** → Contribution will NOT appear
- **PR closed (not merged)** → Contribution will NOT appear
- **Action needed:** Merge the PR to main

---

## Step-by-Step Check

### 1. Check if PR is Merged (MOST IMPORTANT)

**Go to the repository:**
- Repository: `https://github.com/OpenKPIs/OpenKPIs-Content-Dev`
- Find the PR that was created for your KPI
- **Check status:**
  - ✅ **Merged** → Should count (wait 1-5 minutes)
  - ⏳ **Open** → Won't count until merged
  - ❌ **Closed (not merged)** → Won't count

**How to find your PR:**
1. Go to repository → "Pull requests" tab
2. Look for PR with your KPI name
3. Check if it says "Merged" (green badge)

### 2. Check Commit Author Email

**GitHub matches contributions by email address.** The commit email must match a verified email in your GitHub account.

**Check the commit:**
1. Go to the PR
2. Click on the commit (in the PR timeline)
3. Check the author email shown
4. **Verify it matches:**
   - Go to: `https://github.com/settings/emails`
   - Check if the commit email is in your verified emails list
   - ✅ Should be: `devyendar.maganti@gmail.com` (your verified email)

**Common issues:**
- ❌ Email is `username@users.noreply.github.com` (may not count if not verified)
- ❌ Email doesn't match any verified email in your account
- ✅ Should match your verified GitHub email

### 3. Check Commit Author (Not Bot)

**The commit should show YOU, not the bot:**
1. Go to the commit in GitHub
2. **Should show:**
   - ✅ Your GitHub avatar
   - ✅ Your username: `devyendar-maganti`
   - ✅ Links to your profile
   - ❌ NOT "OpenKPIs Bot" or "OpenKPIs[bot]"

**If it shows bot:**
- The user token wasn't used
- Check server logs for errors
- You may need to sign in again

### 4. Check Time Since Merge

**If PR was just merged:**
- Wait **1-5 minutes** (GitHub processing time)
- Refresh your profile page
- Check Contributions graph

**If it's been more than 5 minutes:**
- Check other issues above (email mismatch, bot commit, etc.)
- Can take up to 24 hours in rare cases

---

## Quick Diagnosis Checklist

- [ ] **PR is merged to main** (required!)
- [ ] **Commit email matches verified email** in your GitHub account
- [ ] **Commit shows your username** (not bot)
- [ ] **Wait 1-5 minutes** after merge (usually)
- [ ] **Private contributions enabled** (if repo is private)

---

## How to Fix

### If PR is Not Merged:
1. Go to the PR: `https://github.com/OpenKPIs/OpenKPIs-Content-Dev/pulls`
2. Find your PR
3. Review it (if needed)
4. Click "Merge pull request"
5. Wait 1-5 minutes
6. Check your Contributions graph: `https://github.com/devyendar-maganti`

### If Email Doesn't Match:
1. Check what email was used in the commit (go to commit page)
2. Add that email to your GitHub account: `https://github.com/settings/emails`
3. Verify the email (check your inbox)
4. Future commits will count (past commits won't retroactively count)

### If Commit Shows Bot:
1. Check server logs for: `[GitHub Sync] Using GitHub App with user attribution`
2. If you see bot logs, the user token wasn't used
3. Sign in again to refresh token
4. Create a new KPI

---

## Summary

**Most likely cause:** PR is not merged to main.

**GitHub's rule:** Commits on feature branches only count after the PR is merged.

**Timeline:**
- **After merge:** 1-5 minutes (usually)
- **Maximum:** Up to 24 hours (rare)

**Action:** 
1. Check if PR is merged
2. If merged, wait 1-5 minutes
3. If not merged, merge the PR first
4. Then wait 1-5 minutes

---

## How to Check Your Contribution Status

### In Supabase:
```sql
SELECT 
  c.status,
  c.created_at,
  k.name,
  k.github_pr_number,
  k.github_pr_url
FROM {prefix}_contributions c
JOIN {prefix}_kpis k ON c.item_id = k.id
WHERE c.user_id = 'your-user-id'
ORDER BY c.created_at DESC
LIMIT 5;
```

**Status meanings:**
- `pending` → PR is open (not merged yet)
- `completed` → PR was merged (should count)
- `failed` → PR was closed without merging (won't count)

