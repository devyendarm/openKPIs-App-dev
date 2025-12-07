# JWT Usage Analysis - Is the Earlier Login JWT Used?

## Answer: YES, but only as a FALLBACK

The Supabase auth token cookie (JWT) **IS used**, but only when the dedicated `openkpis_github_token` cookie is missing.

## How It Works

### Priority System in `getUserOAuthTokenWithRefresh()`

```typescript
// Priority 1: Dedicated cookie (FRESH, most recent)
const cookieToken = cookieStore.get('openkpis_github_token')?.value;
if (cookieToken) {
  token = cookieToken; // ✅ Uses this first
}

// Priority 2: JWT user_metadata (FALLBACK, may be stale)
if (!token) {
  token = user.user_metadata?.github_oauth_token; // ⚠️ Only if cookie missing
}
```

### Where JWT is Used

1. **Authentication Check**: `supabase.auth.getUser()` validates the JWT to ensure user is authenticated
2. **Fallback Token Source**: If `openkpis_github_token` cookie is missing, code reads `user.user_metadata.github_oauth_token` from the JWT
3. **User Data**: JWT provides user info (email, username, etc.) for the current session

### The JWT Contains

The Supabase auth token cookie (`sb-cpcabdtnzmanxuclewrg-auth-token.0`) is a JWT that includes:
- User ID
- Email
- **`user_metadata`** (snapshot at login time)
  - This includes `github_oauth_token` from when the JWT was created
  - If user logged in again, the JWT might have an old token

### Why This Works

**Scenario 1: Cookie Exists (Most Common)**
```
1. User logs in → Token stored in both cookie and database
2. Code checks cookie first → Finds fresh token ✅
3. JWT is NOT used for token (but still used for auth)
```

**Scenario 2: Cookie Missing (Fallback)**
```
1. Cookie expired/cleared
2. Code checks cookie → Not found
3. Code checks JWT user_metadata → Finds token (may be stale) ⚠️
4. Token is validated before use
```

## Is the Stale Token in JWT a Problem?

**Short Answer: Usually NO, but could be YES in edge cases**

### Why It's Usually OK

1. **Priority System**: Cookie is checked first (most recent token)
2. **Token Validation**: Even if JWT has stale token, it's validated before use:
   ```typescript
   const octokit = new Octokit({ auth: token });
   await octokit.users.getAuthenticated(); // Validates token
   ```
3. **Silent Refresh**: If token is expired, system attempts refresh
4. **Re-auth Prompt**: If all fails, user is prompted to re-authenticate

### When It Could Be a Problem

**Edge Case**: If:
- Cookie is missing/expired
- JWT has old token
- Old token is expired
- Silent refresh fails
- User doesn't re-authenticate

**Result**: GitHub sync would fail with `requiresReauth: true`

## Current Status (Based on Your Data)

✅ **Cookie exists**: `gho_XXXXXXXXXXXXX` (fresh)  
✅ **Database matches**: Same token in `raw_user_meta_data`  
⚠️ **JWT has old token**: `gho_YYYYYYYYYYYYY` (stale)

**Impact**: **NONE** - Cookie is used first, so stale JWT token is never accessed.

## Recommendation

The current implementation is **correct**:
- ✅ Priority system ensures fresh token is used
- ✅ Fallback to JWT provides cross-device support
- ✅ Token validation catches stale tokens
- ✅ Re-auth prompt handles failures

**No changes needed** - the system is working as designed.

