# Temporary Collaborator Approach - Feasibility Analysis

## The Question

**Can we add a user as a collaborator just before create/edit, then remove them after the flow completes?**

## Short Answer: **Not Practical for Real-Time Flow**

**Why:**
- ❌ GitHub collaborator invitations require **user acceptance** (can't be automated)
- ❌ Invitation acceptance is **asynchronous** (user must click email/notification)
- ❌ This breaks the real-time create/edit flow (user can't wait for acceptance)
- ⚠️ Rate limits on frequent add/remove operations
- ⚠️ Complex state management (tracking pending invitations)

---

## The Problem: Invitation Acceptance

### How GitHub Collaborator Invitations Work

1. **Add Collaborator** → Sends invitation email/notification
2. **User Must Accept** → Clicks link in email or GitHub notification
3. **Then User Can Commit** → Only after acceptance

**This is asynchronous and can't be automated!**

### Timeline Example

```
User clicks "Save" (0s)
  ↓
Add collaborator → Invitation sent (1s)
  ↓
❌ User can't commit yet - invitation pending
  ↓
User must check email/notification (could be minutes/hours)
  ↓
User accepts invitation (whenever they check)
  ↓
Now user can commit (too late - flow already failed)
```

**This doesn't work for a real-time flow!**

---

## Alternative: Hybrid Approach

### Option 1: Pre-Acceptance Check (Better, but still limited)

**Flow:**
1. Check if user is already a collaborator (has accepted previous invitation)
2. If yes → Use user token directly (works immediately)
3. If no → Add collaborator (send invitation) + Fallback to App approach
4. User accepts invitation for **future** operations

**Implementation:**
```typescript
// In syncToGitHub or commitWithUserToken
async function ensureUserCanCommit(userLogin: string, userToken: string) {
  // Check if user is already a collaborator
  try {
    const { status } = await appOctokit.repos.checkCollaborator({
      owner: GITHUB_OWNER,
      repo: GITHUB_CONTENT_REPO,
      username: userLogin,
    });
    
    if (status === 204) {
      // User is already a collaborator - can use user token
      return { canUseUserToken: true, reason: 'already_collaborator' };
    }
  } catch (error) {
    // User is not a collaborator
  }
  
  // User is not a collaborator - send invitation for future
  try {
    await appOctokit.repos.addCollaborator({
      owner: GITHUB_OWNER,
      repo: GITHUB_CONTENT_REPO,
      username: userLogin,
      permission: 'push',
    });
    console.log(`[GitHub Sync] Sent collaborator invitation to ${userLogin} for future operations`);
  } catch (error) {
    console.warn(`[GitHub Sync] Failed to send invitation:`, error);
  }
  
  // Can't use user token now - must use App approach
  return { canUseUserToken: false, reason: 'invitation_pending' };
}
```

**Pros:**
- ✅ First-time users get invitation for future
- ✅ Returning users (who accepted) can commit directly
- ✅ Doesn't break real-time flow

**Cons:**
- ❌ First-time users still don't get contributions (use App)
- ❌ Requires tracking who has accepted invitations
- ❌ Complex state management

---

## Option 2: Add on First Login, Remove on Inactivity

**Flow:**
1. Add user as collaborator on first login (send invitation)
2. User accepts invitation (whenever they check email)
3. User can commit directly (contributions count)
4. Remove collaborator if user inactive for X days

**Implementation:**
```typescript
// In ensure-profile route or auth callback
async function manageCollaboratorAccess(userId: string, userRole: string, githubUsername: string) {
  // Only for admins/editors (or all users if you want)
  if (userRole === 'admin' || userRole === 'editor') {
    // Check if already a collaborator
    const { status } = await appOctokit.repos.checkCollaborator({
      owner: GITHUB_OWNER,
      repo: GITHUB_CONTENT_REPO,
      username: githubUsername,
    });
    
    if (status === 404) {
      // Not a collaborator - send invitation
      await appOctokit.repos.addCollaborator({
        owner: GITHUB_OWNER,
        repo: GITHUB_CONTENT_REPO,
        username: githubUsername,
        permission: 'push',
      });
      console.log(`[Auth] Sent collaborator invitation to ${githubUsername}`);
    }
  }
}
```

**Then in sync flow:**
```typescript
// Check if user is collaborator before committing
const { status } = await appOctokit.repos.checkCollaborator({
  owner: GITHUB_OWNER,
  repo: GITHUB_CONTENT_REPO,
  username: userLogin,
});

if (status === 204) {
  // User is collaborator - use user token
  const userOctokit = new Octokit({ auth: userToken });
  await userOctokit.repos.createOrUpdateFileContents({...});
  // ✅ Contributions count!
} else {
  // User not collaborator yet - use App approach
  // ❌ Contributions don't count (but operation succeeds)
}
```

**Pros:**
- ✅ Users get invitation on first login
- ✅ Once accepted, all future commits count
- ✅ No real-time flow disruption

**Cons:**
- ❌ First commit after login doesn't count (invitation pending)
- ❌ Need to track and remove inactive users
- ❌ More collaborators to manage

---

## Option 3: Temporary Add/Remove (Your Question)

**Flow:**
1. Add collaborator before create/edit
2. Wait for acceptance (❌ **This breaks the flow**)
3. Commit with user token
4. Remove collaborator after commit

**Why This Doesn't Work:**
- ❌ Can't wait for acceptance in real-time flow
- ❌ User would need to accept invitation before clicking "Save"
- ❌ Complex state management (what if user doesn't accept?)
- ❌ Rate limits on frequent add/remove
- ❌ Poor UX (user must accept invitation first)

**Not Recommended** ❌

---

## Recommended Approach: Pre-Add on Login

### Best Solution: Add Collaborator on First Login

**Implementation:**

1. **On Login (ensure-profile route):**
   ```typescript
   // Add collaborator invitation on first login
   // User accepts invitation (whenever they check email)
   // Future commits use user token → contributions count
   ```

2. **In Create/Edit Flow:**
   ```typescript
   // Check if user is collaborator
   // If yes → use user token (contributions count)
   // If no → use App approach (contributions don't count, but works)
   ```

3. **Cleanup (Optional):**
   ```typescript
   // Remove collaborator if user inactive for 90 days
   // Or remove if role changes from editor/admin to contributor
   ```

**Benefits:**
- ✅ Once accepted, all commits count
- ✅ No real-time flow disruption
- ✅ Simple state management
- ✅ Works for all users (not just admins/editors)

**Trade-offs:**
- ⚠️ First commit after login might not count (if invitation not accepted yet)
- ⚠️ More collaborators to manage
- ⚠️ Need cleanup process for inactive users

---

## Comparison Table

| Approach | Real-Time Flow | Contributions | Complexity | Recommended |
|----------|---------------|---------------|------------|-------------|
| **Temporary Add/Remove** | ❌ Breaks (needs acceptance) | ✅ If accepted | ❌ High | ❌ No |
| **Pre-Add on Login** | ✅ Works | ✅ After acceptance | ✅ Low | ✅ **Yes** |
| **Role-Based (Admins/Editors)** | ✅ Works | ✅ After acceptance | ✅ Low | ✅ **Yes** |
| **Check Before Commit** | ✅ Works | ✅ If already collaborator | ⚠️ Medium | ⚠️ Maybe |

---

## Implementation Recommendation

### Option A: Pre-Add All Users on Login (Simplest)

**Add collaborator invitation on first login for all users:**
- Once accepted, all commits count
- Simple to implement
- No role checking needed

### Option B: Pre-Add Only Admins/Editors (More Secure)

**Add collaborator invitation only for admins/editors:**
- Limited security exposure
- Contributors use App approach
- Role-based access control

### Option C: Hybrid (Check Before Commit)

**Check if user is collaborator before each commit:**
- If yes → use user token (contributions count)
- If no → send invitation + use App approach
- User accepts for future operations

---

## Code Example: Pre-Add on Login

```typescript
// In app/api/auth/ensure-profile/route.ts
export async function POST() {
  // ... existing profile creation logic ...
  
  // After profile is created/updated
  const userRole = await getUserRoleServer();
  const githubUsername = user.user_metadata?.preferred_username;
  
  // Option 1: Add all users
  // if (githubUsername) { await addCollaboratorIfNeeded(githubUsername); }
  
  // Option 2: Add only admins/editors (recommended)
  if ((userRole === 'admin' || userRole === 'editor') && githubUsername) {
    await addCollaboratorIfNeeded(githubUsername);
  }
  
  // ... rest of function ...
}

async function addCollaboratorIfNeeded(githubUsername: string) {
  const appOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: { appId, privateKey, installationId },
  });
  
  try {
    // Check if already a collaborator
    const { status } = await appOctokit.repos.checkCollaborator({
      owner: GITHUB_OWNER,
      repo: GITHUB_CONTENT_REPO,
      username: githubUsername,
    });
    
    if (status === 404) {
      // Not a collaborator - send invitation
      await appOctokit.repos.addCollaborator({
        owner: GITHUB_OWNER,
        repo: GITHUB_CONTENT_REPO,
        username: githubUsername,
        permission: 'push',
      });
      console.log(`[Auth] Sent collaborator invitation to ${githubUsername}`);
    }
  } catch (error) {
    console.error(`[Auth] Failed to manage collaborator access:`, error);
    // Don't block login if this fails
  }
}
```

**Then in sync flow:**
```typescript
// In lib/services/github.ts - commitWithUserToken
async function commitWithUserToken(userToken: string, params: GitHubSyncParams) {
  // Check if user is collaborator
  const appOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: { appId, privateKey, installationId },
  });
  
  let isCollaborator = false;
  try {
    const { status } = await appOctokit.repos.checkCollaborator({
      owner: GITHUB_OWNER,
      repo: GITHUB_CONTENT_REPO,
      username: params.userLogin,
    });
    isCollaborator = (status === 204);
  } catch (error) {
    // User is not a collaborator
  }
  
  if (isCollaborator) {
    // User is collaborator - use user token (contributions count!)
    const userOctokit = new Octokit({ auth: userToken });
    await userOctokit.repos.createOrUpdateFileContents({
      branch: 'main',
      path: filePath,
      // ... commit as user
    });
    console.log('[GitHub Sync] User token commit - contributions will count!');
    return { success: true, ... };
  } else {
    // User not collaborator yet - use App approach
    // (invitation might be pending, or user hasn't accepted)
    console.log('[GitHub Sync] User not collaborator - using App approach');
    // Continue with App approach...
  }
}
```

---

## Summary

**Temporary add/remove approach:**
- ❌ **Not practical** - requires invitation acceptance (breaks real-time flow)
- ❌ Complex state management
- ❌ Rate limit concerns

**Recommended: Pre-add on login:**
- ✅ Add collaborator invitation on first login
- ✅ User accepts invitation (whenever they check email)
- ✅ Future commits use user token → contributions count
- ✅ Simple, scalable, secure (if role-based)

**Best approach:** Pre-add admins/editors on login, check collaborator status before each commit.

