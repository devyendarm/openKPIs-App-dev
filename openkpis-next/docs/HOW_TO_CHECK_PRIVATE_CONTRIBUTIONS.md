# How to Check Private Contributions Setting

## What This Setting Does

GitHub has a setting that controls whether contributions to **private repositories** appear on your public profile. However, this setting can also affect how contributions are displayed.

## How to Check

### Step 1: Go to Profile Settings

1. Go to: `https://github.com/settings/profile`
2. Or navigate: GitHub → Your Profile → Settings → Profile

### Step 2: Find Contributions Section

1. Scroll down to **"Contributions & activity"** section
2. Look for: **"Include private contributions on my profile"** checkbox

### Step 3: Check the Status

**If checked (enabled):**
- ✅ Private repository contributions will show on your profile
- ✅ This might also affect how other contributions are counted

**If unchecked (disabled):**
- ❌ Private repository contributions won't show
- ⚠️ This might affect contribution counting in some cases

## Important Note

**For Public Repositories:**
- This setting **should not** affect contributions to public repositories
- Your repository (`OpenKPIs-Content-Dev`) is **public**
- So this setting is **unlikely** to be the issue

**However:**
- Some users report that enabling this setting helps with contribution visibility
- It's worth checking and enabling if it's disabled

## Quick Check

**Direct URL:**
- `https://github.com/settings/profile`

**What to look for:**
- Scroll to "Contributions & activity"
- Check if "Include private contributions on my profile" is enabled
- If not, enable it and wait a few minutes

## Alternative: Check via API

You can also check this via GitHub API (if you have a token):

```bash
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/user
```

Look for `"public_repos"` and contribution-related fields in the response.

## Summary

1. Go to: `https://github.com/settings/profile`
2. Scroll to "Contributions & activity"
3. Enable "Include private contributions on my profile" (if disabled)
4. Wait a few minutes and check your profile again

**Note:** Since your repo is public, this is unlikely to be the issue, but it's worth checking.

