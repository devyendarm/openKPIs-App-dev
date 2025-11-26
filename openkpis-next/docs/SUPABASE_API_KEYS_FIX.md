# Supabase API Keys: Anon vs Publishable

## The Issue

Supabase has two types of public API keys:
1. **Legacy**: `anon` key (still supported)
2. **New**: `publishable` key (newer projects)

Your code is currently using `NEXT_PUBLIC_SUPABASE_ANON_KEY`, which expects the **legacy `anon` key**.

## How to Check Which Key Type You Have

### Step 1: Go to Supabase Dashboard
1. Navigate to **Settings** → **API**
2. Look at the keys section

### Step 2: Identify Your Key Type

**If you see:**
- ✅ **"anon public"** or **"anon key"** → You have the legacy key
- ✅ **"publishable"** or **"publishable key"** → You have the new key

**Both work for OAuth**, but the environment variable name matters.

## Solution Options

### Option 1: Use Legacy Anon Key (Recommended - No Code Changes)

1. In Supabase Dashboard → **Settings** → **API**
2. Find the **"anon public"** key (not "publishable")
3. Copy that key
4. Set in Vercel: `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (the anon key)

**Note:** If you only see "publishable" and no "anon", your project might be on the new key system. In that case, use Option 2.

### Option 2: Update Code to Support Both Keys

Update the code to check for both `anon` and `publishable` keys:

**File:** `lib/supabase/client.ts`
```typescript
function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Try publishable first (new), then fall back to anon (legacy)
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !anonKey) {
    throw new Error('[Supabase] Missing env: NEXT_PUBLIC_SUPABASE_URL and (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY) are required.');
  }
  return { url, key: anonKey };
}
```

**File:** `lib/supabase/server.ts`
```typescript
function getSupabaseServerConfig(useAnonKey: boolean = true) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

  if (useAnonKey) {
    // Try publishable first (new), then fall back to anon (legacy)
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 
      || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!url || !anonKey) {
      throw new Error('[Supabase] Missing server auth envs: NEXT_PUBLIC_SUPABASE_URL and (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
    }
    return { url, key: anonKey };
  }
  // ... rest of the function
}
```

**File:** `app/auth/callback/route.ts`
```typescript
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
```

Then in Vercel, set:
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = (your publishable key)

OR

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your anon key)

## Important Notes

### For OAuth Authentication:
- ✅ **Both `anon` and `publishable` keys work** for OAuth
- ✅ They are functionally equivalent for authentication
- ❌ **Do NOT use `service_role` or `secret` keys** for client-side OAuth

### Key Differences:
- **`anon` / `publishable`**: Public keys, safe for client-side, respect RLS policies
- **`service_role` / `secret`**: Private keys, server-side only, bypass RLS (dangerous if exposed)

## Verification Steps

1. **Check Supabase Dashboard:**
   - Settings → API
   - Note which keys you see (anon vs publishable)

2. **Check Vercel Environment Variables:**
   - Settings → Environment Variables
   - Verify which key name is set

3. **Test:**
   - If using `anon` key → Set `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - If using `publishable` key → Either:
     - Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (publishable key value) - **Works!**
     - OR update code to support both (Option 2)

## Most Likely Issue

**If everything is configured correctly but login still fails:**

The issue is **NOT** the key type (both work), but rather:
1. ❌ Redirect URL not configured in Supabase (most common)
2. ❌ Wrong Supabase project configured
3. ❌ Environment variables not set correctly in Vercel

**The key type (`anon` vs `publishable`) should NOT cause OAuth failures** - both are functionally equivalent for authentication.

## Quick Fix

**If you have a `publishable` key but code expects `anon`:**

Simply set in Vercel:
```
NEXT_PUBLIC_SUPABASE_ANON_KEY = <your-publishable-key-value>
```

The variable name is just a label - the actual key value works the same way.

