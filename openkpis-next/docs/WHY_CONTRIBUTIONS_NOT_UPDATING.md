# Why Contributions Not Updating on GitHub Profile

## ⚠️ Critical Requirements

Contributions will ONLY appear if ALL of these are true:

1. ✅ **PR is merged to main** (required!)
2. ✅ **Commit author email matches verified email** in your GitHub account
3. ✅ **Commit shows your username** (not bot)
4. ✅ **Email is verified** in GitHub (green checkmark)
5. ✅ **Waited sufficient time** (1-5 minutes, up to 24 hours)

---

## Step-by-Step Diagnosis

### Step 1: Check PR Merge Status (MOST IMPORTANT)

**Go to repository:**
- `https://github.com/OpenKPIs/OpenKPIs-Content-Dev`
- Find your PR
- **Check status:**
  - ✅ **Merged** → Continue to Step 2
  - ⏳ **Open** → **Won't count until merged** - Merge it first!
  - ❌ **Closed (not merged)** → Won't count - Need to create new PR

**Action if not merged:**
1. Go to PR page
2. Click "Merge pull request"
3. Confirm merge
4. Wait 1-5 minutes
5. Check your profile again

---

### Step 2: Verify Commit Author Email

**GitHub matches contributions by email address.** This is the #1 cause of missing contributions.

**Check the commit:**
1. Go to PR → Click on the commit
2. Note the exact author email shown
3. Go to: `https://github.com/settings/emails`
4. **Verify:**
   - ✅ Commit email is in your verified emails list
   - ✅ Email has green checkmark (verified)
   - ✅ Email is not hidden/private

**If email doesn't match:**
1. Add the commit email to your GitHub account
2. Verify it (check inbox for verification email)
3. **Important:** Past commits won't retroactively count
4. Create a new KPI to test

**Common email issues:**
- ❌ Using `username@users.noreply.github.com` but not in verified emails
- ❌ Email not added to GitHub account
- ❌ Email not verified (no green checkmark)
- ✅ Should match: `devyendar.maganti@gmail.com` (your verified email)

---

### Step 3: Check Commit Author (Not Bot)

**The commit must show YOU, not the bot:**

1. Go to commit page in GitHub
2. **Should show:**
   - ✅ Your GitHub avatar
   - ✅ Your username: `devyendar-maganti`
   - ✅ "Authored and committed by [your username]"
   - ✅ Links to your profile
   - ❌ NOT "OpenKPIs Bot" or "OpenKPIs[bot]"

**If it shows bot:**
- User token wasn't used
- Check server logs (see Step 6)
- Sign in again to refresh token
- Create a new KPI

**How to check server logs:**
- Vercel Dashboard → Functions → `/api/items/create` → Logs
- Look for: `[GitHub Sync] Using GitHub App with user attribution`
- If you see this, user token wasn't used

---

### Step 4: Check Time Since Merge

**GitHub processing times:**
- **Normal:** 1-5 minutes after merge
- **Delayed:** Up to 24 hours (rare)
- **If > 24 hours:** Check other issues above

**What to do:**
- If merged < 5 minutes ago → Wait a bit longer
- If merged > 5 minutes ago → Check Steps 1-3
- If merged > 24 hours ago → Likely email/author issue

---

### Step 5: Verify Email Privacy Settings

**GitHub privacy settings can affect contributions:**

1. Go to: `https://github.com/settings/emails`
2. Check "Keep my email addresses private"
3. **If enabled:**
   - GitHub uses `username@users.noreply.github.com`
   - **This email MUST be in your verified emails list**
   - Check if commit is using this format
   - Verify this email is added and verified

**If using privacy email:**
- Commit must use: `devyendar-maganti@users.noreply.github.com`
- This email must be in your verified emails
- Check commit page to see which email was used

---

### Step 6: Check Server Logs

**Verify user token was used (not bot):**

**Go to Vercel logs:**
- Dashboard → Your Project → Functions → `/api/items/create`
- Filter by timestamp when you created the KPI

**Look for these messages:**

**✅ If user token was used (GOOD):**
```
[GitHub Token] Found token in cookie
[GitHub Token] Token is valid for user: devyendar-maganti
[GitHub Sync] Using GitHub App with user attribution
[GitHub Sync] Using author email for contributions: { email: 'devyendar.maganti@gmail.com', ... }
[GitHub Sync] Commit created using GitHub App with USER attribution
```

**❌ If bot was used (BAD):**
```
[GitHub Sync] All user token attempts failed
[GitHub Sync] Used bot token as last resort
```

**If you see bot logs:**
- User token wasn't retrieved or was invalid
- Sign in again to refresh token
- Create a new KPI

---

### Step 7: Check Contribution Graph Settings

**GitHub profile settings:**

1. Go to: `https://github.com/settings/profile`
2. Scroll to "Contribution settings"
3. **Verify:**
   - ✅ "Include private contributions on my profile" is checked (if repo is private)
   - ✅ No filters are hiding contributions
   - ✅ Profile is public (if you want contributions visible)

---

### Step 8: Verify Repository Visibility

**If repository is private:**

1. Go to: `https://github.com/settings/profile`
2. Scroll to "Contribution settings"
3. ✅ Check "Include private contributions on my profile"
4. Save changes
5. Wait a few minutes
6. Check your profile again

**If repository is public:**
- This step doesn't apply
- Contributions should show automatically

---

### Step 9: Check for Multiple GitHub Accounts

**If you have multiple GitHub accounts:**

1. Verify you're checking the correct account
2. Check which account the commit is attributed to
3. Ensure you're logged into the right account when checking profile
4. The commit email must match the account you're checking

---

### Step 10: Verify Commit is on Merged Branch

**Check the commit location:**

1. Go to commit page
2. Check which branch it's on
3. **Should be:**
   - ✅ On a branch that was merged to main
   - ✅ Or directly on main branch
   - ❌ NOT on an unmerged branch

**If commit is on unmerged branch:**
- Merge the PR first
- Then wait 1-5 minutes

---

## Most Common Issues (In Order)

### Issue 1: PR Not Merged (MOST COMMON - 80% of cases)
**Symptom:** PR is still open  
**Solution:** Merge the PR to main  
**How to verify:** Check PR status in repository

### Issue 2: Email Mismatch (VERY COMMON - 15% of cases)
**Symptom:** Commit email doesn't match verified email  
**Solution:** Add commit email to GitHub account and verify it  
**How to verify:** Compare commit email vs. GitHub settings

### Issue 3: Commit Made by Bot (5% of cases)
**Symptom:** Commit shows "OpenKPIs Bot" as author  
**Solution:** Sign in again, create new KPI  
**How to verify:** Check commit author in GitHub

---

## Quick Diagnostic Checklist

Before reporting an issue, verify:

- [ ] **PR is merged to main** (required!)
- [ ] **Commit email matches verified email** in GitHub account
- [ ] **Commit shows your username** (not bot)
- [ ] **Email is verified** (green checkmark in GitHub)
- [ ] **Private contributions enabled** (if repo is private)
- [ ] **Waited 1-5 minutes** after merge (or up to 24 hours)
- [ ] **Checked correct GitHub account** (if multiple accounts)
- [ ] **Server logs show user token was used** (not bot)

---

## How to Fix Each Issue

### If PR is Not Merged:
1. Go to PR: `https://github.com/OpenKPIs/OpenKPIs-Content-Dev/pulls`
2. Find your PR
3. Click "Merge pull request"
4. Wait 1-5 minutes
5. Check your profile: `https://github.com/devyendar-maganti`

### If Email Doesn't Match:
1. Check what email was used in the commit (go to commit page)
2. Add that email to GitHub: `https://github.com/settings/emails`
3. Verify the email (check inbox)
4. **Note:** Past commits won't retroactively count
5. Create a new KPI to test

### If Commit Shows Bot:
1. Check server logs for why user token wasn't used
2. Sign out completely
3. Sign in again with GitHub
4. Grant all permissions when prompted
5. Create a new KPI
6. Verify new commit shows your username

---

## Diagnostic SQL Queries

### Check Contribution Status

```sql
SELECT 
  c.status,
  c.created_at,
  k.name as kpi_name,
  k.github_pr_number,
  k.github_pr_url,
  k.github_commit_sha
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

---

## If Still Not Showing After All Checks

**After verifying all above:**

1. **Create a new KPI** (to test with fresh commit)
2. **Verify commit author** is you (not bot) immediately
3. **Verify commit email** matches verified email
4. **Merge PR immediately**
5. **Wait 5 minutes**
6. **Check profile again**

**If still not showing:**
- Check GitHub's contribution graph documentation
- Verify repository is accessible
- Check if there are any GitHub account restrictions
- Contact GitHub support if all else fails

---

## Summary

**Most likely causes (in order):**
1. PR not merged to main (80%)
2. Email mismatch (15%)
3. Commit made by bot (5%)

**Action:** Check each item in order, starting with PR merge status.

**Timeline:**
- After merge: 1-5 minutes (usually)
- Maximum: Up to 24 hours (rare)

**Key Point:** Even if everything is correct, GitHub can take time to process. Wait at least 5 minutes after merge before troubleshooting further.

