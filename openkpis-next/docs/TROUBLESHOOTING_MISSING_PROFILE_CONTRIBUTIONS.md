# Troubleshooting: Contributions Not Showing on GitHub Profile

## ⚠️ Critical Requirements Checklist

Before troubleshooting, verify these requirements are met:

### ✅ Requirement 1: PR Must Be Merged to Main
- **Status:** PR must be **merged** (not just open or closed)
- **Check:** Go to PR → Should show "Merged" badge
- **If not merged:** Merge the PR first, then wait 1-5 minutes

### ✅ Requirement 2: Commit Author Email Matches Verified Email
- **Status:** Commit email must match a verified email in your GitHub account
- **Check:** 
  1. Go to commit page
  2. Check author email
  3. Go to: `https://github.com/settings/emails`
  4. Verify the commit email is in your verified emails list
- **If mismatch:** Add and verify the email in GitHub settings

### ✅ Requirement 3: Commit Author is User (Not Bot)
- **Status:** Commit must show YOUR username, not bot
- **Check:** Commit page should show your avatar and username
- **If bot:** User token wasn't used - sign in again and create new KPI

### ✅ Requirement 4: Repository Visibility Settings
- **If repo is private:** Enable "Include private contributions" in profile settings
- **Check:** `https://github.com/settings/profile` → Contribution settings

---

## Step-by-Step Troubleshooting

### Step 1: Verify PR is Merged

**Go to repository:**
- `https://github.com/OpenKPIs/OpenKPIs-Content-Dev`
- Find your PR
- **Check status:**
  - ✅ **Merged** → Continue to Step 2
  - ⏳ **Open** → Merge it first
  - ❌ **Closed (not merged)** → Won't count (need to create new PR)

**How to merge:**
1. Go to PR page
2. Click "Merge pull request"
3. Confirm merge
4. Wait 1-5 minutes

---

### Step 2: Check Commit Author Email

**GitHub matches contributions by email address.** The commit email must match a verified email.

**Check the commit:**
1. Go to PR → Click on the commit
2. Note the author email shown
3. Go to: `https://github.com/settings/emails`
4. **Verify:**
   - ✅ Commit email is in your verified emails list
   - ✅ Email has green checkmark (verified)

**If email doesn't match:**
1. Add the commit email to your GitHub account
2. Verify the email (check inbox)
3. **Note:** Past commits won't retroactively count
4. Future commits will count

**Common issues:**
- ❌ Email is `username@users.noreply.github.com` (may not count if not verified)
- ❌ Email not in your GitHub account
- ✅ Should be: `devyendar.maganti@gmail.com` (your verified email)

---

### Step 3: Check Commit Author (Not Bot)

**The commit should show YOU, not the bot:**

1. Go to commit page
2. **Should show:**
   - ✅ Your GitHub avatar
   - ✅ Your username: `devyendar-maganti`
   - ✅ Links to your profile
   - ✅ "Authored and committed by [your username]"
   - ❌ NOT "OpenKPIs Bot" or "OpenKPIs[bot]"

**If it shows bot:**
- User token wasn't used
- Check server logs for errors
- Sign in again to refresh token
- Create a new KPI

**How to check server logs:**
- Vercel Dashboard → Functions → `/api/items/create`
- Look for: `[GitHub Sync] Using GitHub App with user attribution`
- If you see this, user token wasn't used

---

### Step 4: Check Repository Visibility

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

### Step 5: Check Time Delay

**GitHub processing times:**
- **Normal:** 1-5 minutes after merge
- **Delayed:** Up to 24 hours (rare)
- **If > 24 hours:** Check other issues above

**What to do:**
1. If merged < 5 minutes ago → Wait a bit longer
2. If merged > 5 minutes ago → Check Steps 1-4
3. If merged > 24 hours ago → Likely an email/author issue

---

### Step 6: Verify Email in Commit Matches GitHub Settings

**This is the most common issue!**

**Check commit email:**
1. Go to commit page
2. Click on author name/email
3. Note the exact email address

**Check GitHub email settings:**
1. Go to: `https://github.com/settings/emails`
2. Check "Primary email" and "Additional emails"
3. **Verify:**
   - ✅ Commit email is listed
   - ✅ Email has green checkmark (verified)
   - ✅ Email is not hidden (if using privacy settings)

**If email doesn't match:**
1. Add the commit email to your GitHub account
2. Verify it (check inbox for verification email)
3. **Important:** Past commits won't retroactively count
4. Create a new KPI to test

---

### Step 7: Check if Email is Hidden

**GitHub privacy settings can hide emails:**

1. Go to: `https://github.com/settings/emails`
2. Check "Keep my email addresses private"
3. If enabled, GitHub uses `username@users.noreply.github.com`
4. **Verify this email is in your account:**
   - Should be: `devyendar-maganti@users.noreply.github.com`
   - Must be in your verified emails list

**If using privacy email:**
- The commit must use `username@users.noreply.github.com`
- This email must be in your verified emails
- Check if commit is using this format

---

### Step 8: Check Contribution Graph Settings

**GitHub profile settings:**

1. Go to: `https://github.com/settings/profile`
2. Scroll to "Contribution settings"
3. **Verify:**
   - ✅ "Include private contributions" is checked (if repo is private)
   - ✅ No filters are hiding contributions
   - ✅ Profile is public (if you want contributions visible)

---

### Step 9: Verify Commit is on Merged Branch

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

### Step 10: Check for Multiple GitHub Accounts

**If you have multiple GitHub accounts:**

1. Verify you're checking the correct account
2. Check which account the commit is attributed to
3. Ensure you're logged into the right account when checking profile

---

## Common Issues and Solutions

### Issue 1: PR Not Merged (MOST COMMON)
**Symptom:** PR is still open  
**Solution:** Merge the PR to main  
**How to verify:** Check PR status in repository

### Issue 2: Email Mismatch (VERY COMMON)
**Symptom:** Commit email doesn't match verified email  
**Solution:** Add commit email to GitHub account and verify it  
**How to verify:** Compare commit email vs. GitHub settings

### Issue 3: Commit Made by Bot
**Symptom:** Commit shows "OpenKPIs Bot" as author  
**Solution:** Sign in again, create new KPI  
**How to verify:** Check commit author in GitHub

### Issue 4: Email Not Verified
**Symptom:** Email is in account but not verified  
**Solution:** Verify the email (check inbox)  
**How to verify:** Check email has green checkmark in GitHub settings

### Issue 5: Privacy Email Not Added
**Symptom:** Using `username@users.noreply.github.com` but not in account  
**Solution:** Add privacy email to GitHub account  
**How to verify:** Check if privacy email is in verified emails list

### Issue 6: Private Repo Contributions Disabled
**Symptom:** Repo is private, contributions not showing  
**Solution:** Enable "Include private contributions" in profile settings  
**How to verify:** Check GitHub profile settings

---

## Diagnostic Queries

### Check Contribution Status in Supabase

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

### Check Commit Details in GitHub

**Go to commit page and verify:**
- Author name: Should be your GitHub username
- Author email: Should match your verified email
- Committer: Should be you (not bot)
- Branch: Should be merged to main

---

## Final Checklist

Before reporting an issue, verify:

- [ ] **PR is merged to main** (required!)
- [ ] **Commit email matches verified email** in GitHub account
- [ ] **Commit shows your username** (not bot)
- [ ] **Email is verified** (green checkmark in GitHub)
- [ ] **Private contributions enabled** (if repo is private)
- [ ] **Waited 1-5 minutes** after merge (or up to 24 hours)
- [ ] **Checked correct GitHub account** (if multiple accounts)

---

## If Still Not Showing

**After checking all above:**

1. **Create a new KPI** (to test with fresh commit)
2. **Verify commit author** is you (not bot)
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

**Most common causes (in order):**
1. PR not merged to main
2. Email mismatch (commit email ≠ verified email)
3. Commit made by bot (user token not used)
4. Email not verified in GitHub account
5. Private contributions disabled (for private repos)

**Action:** Check each item in order, starting with PR merge status.

