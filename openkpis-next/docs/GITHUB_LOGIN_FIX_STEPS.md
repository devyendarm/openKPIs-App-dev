# GitHub Login Fix - Step-by-Step Guide

## Issue: `bad_oauth_state` / OAuth callback with invalid state

This is **primarily a Supabase configuration issue**, not a code issue.

---

## Step 1: Configure Redirect URL in Supabase (REQUIRED)

### 1.1 Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project (the one used by openkpis.org)

### 1.2 Navigate to Authentication Settings
1. In the left sidebar, click **Authentication**
2. Click **URL Configuration** (or **Providers** → **GitHub** → **Settings`)

### 1.3 Add Redirect URLs
Under **Redirect URLs**, add these URLs (one per line):

**For Production:**
```
https://openkpis.org/auth/callback
```

**For Development (if needed):**
```
http://localhost:3000/auth/callback
```

**Important Notes:**
- ✅ Include the **exact** URL with `/auth/callback` path
- ✅ Use `https://` for production (not `http://`)
- ✅ No trailing slashes
- ✅ Must match exactly what's in your code

### 1.4 Save Changes
1. Click **Save** or **Update**
2. Wait 1-2 minutes for changes to propagate

---

## Step 2: Verify Supabase Environment Variables

### 2.1 Check Vercel Environment Variables
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`openkpis-next` or similar)
3. Go to **Settings** → **Environment Variables**

### 2.2 Verify These Variables Are Set

**Required for OAuth:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**To get these values:**
1. Go to Supabase Dashboard → **Settings** → **API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2.3 Ensure Variables Are Set for Production
- Make sure these are set for **Production** environment
- If you have Preview/Development, set them there too

---

## Step 3: Verify GitHub OAuth App in Supabase

### 3.1 Check GitHub Provider Configuration
1. In Supabase Dashboard → **Authentication** → **Providers**
2. Find **GitHub** in the list
3. Click to open settings

### 3.2 Verify GitHub OAuth App
1. **Client ID** should be set (from GitHub OAuth App)
2. **Client Secret** should be set (from GitHub OAuth App)
3. If not configured, you need to create a GitHub OAuth App first

### 3.3 Create GitHub OAuth App (if needed)
1. Go to GitHub → **Settings** → **Developer settings** → **OAuth Apps**
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: `OpenKPIs` (or your app name)
   - **Homepage URL**: `https://openkpis.org`
   - **Authorization callback URL**: `https://your-project.supabase.co/auth/v1/callback`
     - ⚠️ **Important**: This is your Supabase project URL + `/auth/v1/callback`
     - Get your Supabase URL from: Supabase Dashboard → Settings → API → Project URL
4. Click **Register application**
5. Copy **Client ID** and **Client Secret**
6. Paste them into Supabase → Authentication → Providers → GitHub

---

## Step 4: Test the Fix

### 4.1 Clear Browser Data
1. Clear all cookies for `openkpis.org`
2. Or use Incognito/Private browsing mode

### 4.2 Test Login
1. Go to `https://openkpis.org`
2. Click **Sign in** (or **Sign in with GitHub**)
3. Should redirect to GitHub authorization page
4. After authorizing, should redirect back to `https://openkpis.org/auth/callback`
5. Then should redirect to homepage with `_auth_success=1` in URL

### 4.3 Check for Errors
- ✅ **Success**: You're signed in, see your GitHub username
- ❌ **Still getting `bad_oauth_state`**: Continue to troubleshooting

---

## Step 5: Troubleshooting

### Issue: Still getting `bad_oauth_state` after adding redirect URL

**Solution 1: Wait and Retry**
- Supabase changes can take 1-2 minutes to propagate
- Wait 2 minutes, clear cookies, try again

**Solution 2: Verify Redirect URL Exactly Matches**
- Check Supabase Dashboard → Authentication → URL Configuration
- Must be exactly: `https://openkpis.org/auth/callback`
- No trailing slash, correct protocol (https)

**Solution 3: Check Cookie Settings**
- The code sets cookies with `sameSite: 'lax'` and `secure: true` in production
- This should work, but if issues persist, check browser console for cookie errors

**Solution 4: Verify Supabase Project**
- Make sure you're configuring the **correct Supabase project**
- The one used by your production site (check `NEXT_PUBLIC_SUPABASE_URL`)

### Issue: Redirect URL not saving in Supabase

**Solution:**
- Some Supabase interfaces require clicking "Add" or "+" button
- Make sure the URL appears in the list before saving
- Try refreshing the page and checking again

### Issue: Works in dev but not production

**Solution:**
- Make sure production redirect URL is added (not just dev)
- Verify production environment variables in Vercel
- Check that Vercel is using the correct Supabase project

---

## Step 6: Code Verification (Optional)

The code should already be correct, but verify these files:

### 6.1 Check Callback Route
**File:** `app/auth/callback/route.ts`
- Should handle OAuth errors
- Should use `exchangeCodeForSession(code)`
- Should set cookies properly

### 6.2 Check Sign-In Function
**File:** `lib/supabase/auth.ts`
- `signInWithGitHub()` should set `redirectTo: ${window.location.origin}/auth/callback`
- Should use `provider: 'github'`

### 6.3 Check Environment Variables Usage
**File:** `lib/supabase/client.ts` and `lib/supabase/server.ts`
- Should read `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Should throw errors if missing

---

## Quick Checklist

- [ ] Redirect URL `https://openkpis.org/auth/callback` added in Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set in Vercel (production)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set in Vercel (production)
- [ ] GitHub OAuth App created (if not already)
- [ ] GitHub Client ID and Secret configured in Supabase
- [ ] Waited 1-2 minutes after making changes
- [ ] Cleared browser cookies
- [ ] Tested login flow

---

## Summary

**This is 99% a configuration issue, not code.**

The most common cause is:
1. ❌ Redirect URL not configured in Supabase
2. ❌ Wrong Supabase project configured
3. ❌ Environment variables not set correctly

**Fix priority:**
1. **HIGHEST**: Add redirect URL in Supabase (Step 1)
2. **HIGH**: Verify environment variables (Step 2)
3. **MEDIUM**: Check GitHub OAuth App (Step 3)

After completing Step 1, the login should work. If not, proceed through the remaining steps.

---

## Need Help?

If issues persist after following all steps:
1. Check Supabase Dashboard → Authentication → Logs for detailed error messages
2. Check browser console for JavaScript errors
3. Check Vercel function logs for server-side errors
4. Verify the exact error message and compare with Supabase documentation

