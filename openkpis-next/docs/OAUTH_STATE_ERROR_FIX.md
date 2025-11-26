# OAuth State Error Fix

## Error: `bad_oauth_state` / `OAuth callback with invalid state`

### What This Error Means

This error occurs when Supabase rejects the OAuth callback because:
1. **Redirect URL mismatch**: The callback URL (`https://openkpis.org/auth/callback`) is not configured in Supabase's allowed redirect URLs
2. **State parameter mismatch**: The OAuth state stored in cookies doesn't match what's returned from GitHub
3. **Cookie/session issues**: Cookies aren't being set/read properly due to SameSite, Secure, or domain settings

### Root Cause

The most common cause is that **the redirect URL is not configured in Supabase**.

### Fix Steps

#### 1. Configure Redirect URL in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Under **Redirect URLs**, add:
   ```
   https://openkpis.org/auth/callback
   ```
4. For development, also add:
   ```
   http://localhost:3000/auth/callback
   ```
5. Click **Save**

#### 2. Verify Environment Variables

Ensure these are set in Vercel (Production):
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

#### 3. Clear Browser Cookies

If the error persists after configuring the redirect URL:
1. Clear all cookies for `openkpis.org`
2. Try signing in again

### Code Changes Made

1. **Improved error handling** in `app/auth/callback/route.ts`:
   - Now catches OAuth errors from the URL parameters
   - Logs detailed error information
   - Redirects to homepage with error message

2. **User-friendly error display** in `app/page.tsx`:
   - Shows error banner when OAuth fails
   - Displays helpful message to users

### Testing

After fixing:
1. Clear browser cookies
2. Try signing in with GitHub
3. Should redirect successfully to `/auth/callback`
4. Should then redirect back to homepage with `_auth_success=1`

### Common Issues

**Issue**: Error persists after adding redirect URL
- **Solution**: Wait 1-2 minutes for Supabase to propagate changes, then try again

**Issue**: Works in dev but not production
- **Solution**: Make sure production redirect URL is added (not just dev URL)

**Issue**: Cookies not being set
- **Solution**: Check that `secure: true` is set in production (it is in the code)
- **Solution**: Verify domain matches exactly (no trailing slashes)

### References

- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-github)
- [Supabase Redirect URL Configuration](https://supabase.com/docs/guides/auth/auth-redirects)

