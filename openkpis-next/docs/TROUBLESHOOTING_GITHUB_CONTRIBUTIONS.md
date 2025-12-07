# Troubleshooting GitHub Contributions Not Showing

## Quick Checklist

1. ✅ **Is the contribution flow embedded?** - YES, it's in create/save flows
2. ✅ **Is user token being used?** - Check server logs
3. ✅ **Is verified email being used?** - Check commit author email
4. ⏰ **Timing** - GitHub contributions can take 1-24 hours to appear

## How to Verify

### 1. Check Server Logs

**Where to find logs:**
- **Vercel (Production)**: Dashboard → Your Project → "Logs" tab → Filter by `api/items/create`
- **Local Development**: Terminal where you run `npm run dev`

**Look for these log messages when creating a KPI:**

**If user token is used (GOOD):**
```
[GitHub Token] Found token in cookie
[GitHub Token] Token is valid
[GitHub Sync] Authenticating with user OAuth token.
```

**If bot token is used (BAD - won't count):**
```
[GitHub Sync] All user token attempts failed, using bot as last resort
[GitHub Sync] Used bot token as last resort - commit will NOT count toward user contributions
```

**See detailed guide**: `docs/HOW_TO_CHECK_SERVER_LOGS.md`

### 2. Check the Commit in GitHub

1. Go to the PR that was created
2. Click on the commit
3. Check:
   - **Author**: Should show YOUR GitHub username/avatar (not "OpenKPIs Bot")
   - **Committer**: Should show YOUR GitHub username/avatar
   - **Email**: Should be your verified GitHub email (not `@users.noreply.github.com`)

### 3. Check Token Storage

The token should be stored in TWO places:
1. **Cookie**: `openkpis_github_token` (immediate use)
2. **Supabase user_metadata**: `github_oauth_token` (cross-device)

**To verify:**
- Check browser DevTools → Application → Cookies → `openkpis_github_token`
- Check Supabase Dashboard → Authentication → Users → Your User → user_metadata → `github_oauth_token`

### 4. Check Verified Email

The commit should use your **verified GitHub email**, not the noreply email.

**To verify:**
- Check the commit in GitHub → Should show your real email
- Check Supabase → `user_profiles` table → `github_verified_email` column

## Common Issues

### Issue 1: Token Not Stored

**Symptoms:**
- Logs show: `[GitHub Token] GitHub token not found. Please sign in with GitHub.`
- Bot token is used instead

**Fix:**
1. Sign out completely
2. Sign in again with GitHub
3. Grant all permissions when prompted
4. Check that token is stored in cookie and user_metadata

### Issue 2: Token Expired

**Symptoms:**
- Logs show: `[GitHub Token] Token expired`
- Falls back to bot token

**Fix:**
1. Sign out and sign back in
2. Token will be refreshed automatically

### Issue 3: Wrong Email Used

**Symptoms:**
- Commit shows `username@users.noreply.github.com`
- Contributions don't count

**Fix:**
1. Ensure your GitHub account has a verified email
2. Re-sign in to refresh the verified email cache
3. Check `user_profiles.github_verified_email` in Supabase

### Issue 4: Bot Token Used Instead

**Symptoms:**
- Commit shows "OpenKPIs Bot" as author
- No contribution green dot

**Possible Causes:**
1. Token not found (Issue 1)
2. Token expired (Issue 2)
3. Token doesn't have `repo` scope (if signed in before scope was added)
4. User not authenticated

**Fix:**
1. Check server logs to see why user token wasn't used
2. **Re-authenticate with GitHub** (sign out and sign back in)
   - This will request the `repo` scope again
   - The code already requests `repo` scope (see `lib/supabase/auth.ts` line 58)
   - If you signed in BEFORE the scope was added, you need to re-authenticate
3. Verify scope in code: `lib/supabase/auth.ts` should have `scopes: 'read:user user:email repo'`

## Timing

GitHub contributions can take:
- **Immediate**: Commit appears in repository
- **1-24 hours**: Green dot appears on profile
- **Up to 24 hours**: Full contribution graph updates

**Note:** If the commit was made with bot token, it will NEVER show up as a contribution, even after 24 hours.

## Verification Steps

1. **Create a new KPI**
2. **Check server logs** (Vercel logs or local console):
   ```
   [GitHub Token] Found token in cookie
   [GitHub Sync] Authenticating with user OAuth token.
   ```
3. **Check the PR** in GitHub:
   - Author should be YOU (not bot)
   - Email should be your verified email
4. **Wait 1-24 hours** for green dot to appear
5. **Check your GitHub profile** contributions graph

## Debugging Commands

### Check if token exists in Supabase
```sql
SELECT 
  id,
  email,
  user_metadata->>'github_oauth_token' as has_token,
  user_metadata->>'github_token_expires_at' as expires_at
FROM auth.users
WHERE email = 'your-email@example.com';
```

### Check verified email cache
```sql
SELECT 
  id,
  email,
  github_verified_email,
  github_email_verified_at
FROM prod_user_profiles
WHERE email = 'your-email@example.com';
```

## Next Steps

If contributions still don't appear after 24 hours:

1. **Verify the commit** was made with your token (check GitHub commit page)
2. **Check the email** matches your GitHub verified email
3. **Check server logs** to confirm user token was used
4. **Re-authenticate** to refresh token and email

