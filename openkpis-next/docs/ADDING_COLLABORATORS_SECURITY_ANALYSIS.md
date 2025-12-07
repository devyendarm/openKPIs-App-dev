# Adding Collaborators via API - Security Analysis

## The Question

**Is it safe to automatically add users as collaborators to the organization repository when they log in?**

## Short Answer: **It Depends on Your Security Model**

**Safe IF:**
- ✅ Only add trusted users (admins/editors)
- ✅ Use appropriate permission levels (`push` not `admin`)
- ✅ Implement branch protection rules
- ✅ Monitor and audit access
- ✅ Have a removal process

**NOT Safe IF:**
- ❌ Add all users automatically (security risk)
- ❌ Grant `admin` permissions to everyone
- ❌ No monitoring or audit trail
- ❌ No way to remove collaborators

---

## Security Risks

### Risk 1: Unrestricted Write Access

**If you add all users as collaborators:**
- ✅ They can commit directly to main
- ✅ Commits will count toward contributions
- ❌ **But:** They can modify ANY file in the repository
- ❌ **But:** They can delete files
- ❌ **But:** They can push malicious code

**Mitigation:**
- Use branch protection rules (require PR reviews)
- Only allow commits to `data-layer-draft/` folder
- Monitor all commits
- Use `push` permission (not `admin`)

### Risk 2: Scalability Issues

**If hundreds of users sign up:**
- ❌ Managing hundreds of collaborators is complex
- ❌ Hard to track who has access
- ❌ Difficult to remove access when needed
- ❌ GitHub has invitation limits (24-hour period)

**Mitigation:**
- Only add specific roles (admins/editors)
- Implement a removal process
- Track collaborators in database

### Risk 3: Abuse Potential

**If anyone can become a collaborator:**
- ❌ Spam accounts could get access
- ❌ Malicious users could modify content
- ❌ Hard to revoke access

**Mitigation:**
- Require email verification
- Only add verified users
- Implement approval process

---

## Recommended Approach: Role-Based Access

### Option 1: Only Add Admins/Editors (Recommended)

**Add collaborators only for:**
- ✅ Admins (full access)
- ✅ Editors (can publish/review)

**Regular contributors:**
- Use App approach (no direct access)
- Or use draft folder with App commits

**Implementation:**
```typescript
// In auth callback or ensure-profile route
const userRole = await getUserRoleServer();

if (userRole === 'admin' || userRole === 'editor') {
  // Add as collaborator with appropriate permissions
  await addUserAsCollaborator(user.githubUsername, userRole);
} else {
  // Regular contributor - use App approach
  // No collaborator access needed
}
```

**Permissions:**
- `admin` role → `push` permission (can commit, can't manage settings)
- `editor` role → `push` permission (can commit, can't manage settings)
- `contributor` role → No collaborator access (use App)

### Option 2: Add All Users (Not Recommended)

**If you add all users:**
- ⚠️ Security risk (unrestricted access)
- ⚠️ Scalability issues
- ⚠️ Hard to manage

**Only consider if:**
- Repository is public (less sensitive)
- You have branch protection rules
- You monitor all commits
- You have automated removal process

---

## GitHub API Implementation

### Add Collaborator Endpoint

```typescript
// Using GitHub App (has org admin access)
const appOctokit = new Octokit({
  authStrategy: createAppAuth,
  auth: { appId, privateKey, installationId }
});

// Add user as collaborator
await appOctokit.repos.addCollaborator({
  owner: GITHUB_OWNER,
  repo: GITHUB_CONTENT_REPO,
  username: user.githubUsername,
  permission: 'push',  // push, pull, maintain, admin, triage
});
```

**Note:** This sends an **invitation** that the user must accept.

### Permission Levels

- **`pull`**: Read-only access
- **`triage`**: Can manage issues and PRs
- **`push`**: Can commit (recommended for contributors)
- **`maintain`**: Can manage repository settings (except billing)
- **`admin`**: Full access (NOT recommended for regular users)

**Recommended:** Use `push` permission for contributors.

---

## Security Best Practices

### 1. Branch Protection Rules

**Protect main branch:**
- Require PR reviews before merge
- Require status checks
- Prevent force pushes
- Prevent deletion

**This ensures:**
- ✅ Users can't push directly to main (even as collaborators)
- ✅ All changes go through PR review
- ✅ Content is reviewed before publishing

### 2. Folder-Level Restrictions

**If possible, restrict commits to draft folder:**
- Users can only commit to `data-layer-draft/`
- Can't modify `data-layer/` directly
- Publish API moves files (controlled process)

**Note:** GitHub doesn't support folder-level permissions natively, but you can:
- Use branch protection (require PR for main)
- Monitor commits (alert on changes outside draft folder)
- Use webhooks to validate file paths

### 3. Monitoring and Auditing

**Track all collaborator additions:**
```typescript
// Log when user is added as collaborator
await logCollaboratorAddition({
  userId,
  githubUsername,
  role,
  permission: 'push',
  addedAt: new Date(),
});
```

**Monitor commits:**
- Check file paths (should be in `data-layer-draft/`)
- Alert on suspicious activity
- Review all commits regularly

### 4. Removal Process

**Remove collaborators when:**
- User account is deleted
- User role changes (editor → contributor)
- User is banned/suspended
- User hasn't logged in for X days

```typescript
// Remove collaborator
await appOctokit.repos.removeCollaborator({
  owner: GITHUB_OWNER,
  repo: GITHUB_CONTENT_REPO,
  username: user.githubUsername,
});
```

---

## Implementation Plan

### Step 1: Add Collaborator on Login (Role-Based)

**In `app/auth/callback/route.ts` or `app/api/auth/ensure-profile/route.ts`:**

```typescript
// After user profile is created/updated
const userRole = await getUserRoleServer();
const githubUsername = user.user_metadata?.preferred_username;

if ((userRole === 'admin' || userRole === 'editor') && githubUsername) {
  try {
    // Check if user is already a collaborator
    const { status } = await appOctokit.repos.checkCollaborator({
      owner: GITHUB_OWNER,
      repo: GITHUB_CONTENT_REPO,
      username: githubUsername,
    });
    
    if (status === 404) {
      // Not a collaborator, add them
      await appOctokit.repos.addCollaborator({
        owner: GITHUB_OWNER,
        repo: GITHUB_CONTENT_REPO,
        username: githubUsername,
        permission: 'push',  // Safe permission level
      });
      console.log(`[Auth] Added ${githubUsername} as collaborator (${userRole})`);
    }
  } catch (error) {
    console.error(`[Auth] Failed to add collaborator:`, error);
    // Don't block login if this fails
  }
}
```

### Step 2: Remove Collaborator on Role Change

**When user role changes from editor/admin to contributor:**

```typescript
// In role update logic
if (oldRole === 'admin' || oldRole === 'editor') {
  if (newRole === 'contributor') {
    // Remove collaborator access
    await appOctokit.repos.removeCollaborator({
      owner: GITHUB_OWNER,
      repo: GITHUB_CONTENT_REPO,
      username: githubUsername,
    });
  }
}
```

### Step 3: Use User Token for Commits (If Collaborator)

**In `commitWithUserToken` function:**

```typescript
// Check if user is collaborator (can commit to main)
if (USE_DRAFT_FOLDER && branchName === 'main') {
  try {
    // Try user token first (if user is collaborator)
    const userOctokit = new Octokit({ auth: userToken });
    await userOctokit.repos.createOrUpdateFileContents({
      branch: 'main',
      path: filePath,
      // ... commit as user
    });
    console.log('[GitHub Sync] User token worked - user is collaborator!');
    return { success: true, ... };
  } catch (error) {
    // User not collaborator or token invalid - fallback to App
    console.warn('[GitHub Sync] User token failed, using App');
    // Continue with App approach
  }
}
```

---

## Security Checklist

Before implementing, ensure:

- [ ] Branch protection rules enabled on main
- [ ] Only add admins/editors as collaborators (not all users)
- [ ] Use `push` permission (not `admin`)
- [ ] Monitor all collaborator additions
- [ ] Implement removal process
- [ ] Track collaborators in database
- [ ] Alert on suspicious commits
- [ ] Regular audit of collaborator list

---

## Alternative: Hybrid Approach

**Best of both worlds:**

1. **Admins/Editors:** Add as collaborators → Can commit directly → Counts
2. **Contributors:** Use App approach → Commits don't count (known issue)

**Benefits:**
- ✅ Admins/editors get contributions
- ✅ Contributors still work (via App)
- ✅ Limited security exposure (only trusted users)
- ✅ Scalable (don't add all users)

---

## Summary

**Is it safe?** 

**YES, IF:**
- ✅ Only add admins/editors (not all users)
- ✅ Use `push` permission (not `admin`)
- ✅ Enable branch protection rules
- ✅ Monitor and audit access
- ✅ Have removal process

**NO, IF:**
- ❌ Add all users automatically
- ❌ Grant `admin` permissions
- ❌ No monitoring or audit
- ❌ No removal process

**Recommended:** Role-based approach - only add admins/editors as collaborators.

