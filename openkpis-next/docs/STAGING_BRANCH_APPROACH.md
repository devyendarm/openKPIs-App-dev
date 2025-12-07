# Staging Branch Approach - Analysis

## Current Approach

**Per-KPI Branch:**
- Each KPI creates its own branch: `created-kpis-{slug}-{timestamp}`
- Each KPI gets its own PR
- Each PR is merged individually to main
- Uses GitHub App for all operations (org repo requirement)

**Issues:**
- App commits might not count toward contributions
- Many branches and PRs
- More complex workflow

---

## Proposed Approach: Single Staging Branch

**Staging Branch Workflow:**
1. All KPIs commit to a single `staging` branch
2. User manually reviews and merges selected PRs from staging → main
3. Could potentially use user token for commits (if user has write access to staging)

**Benefits:**
- ✅ Simpler workflow (one branch, multiple commits)
- ✅ User manually merges → might count as user contribution
- ✅ User has control over what gets merged
- ✅ Could potentially use user token for commits to staging
- ✅ Fewer PRs to manage

**Challenges:**
- ⚠️ Need to check if user can commit to staging branch in org repo
- ⚠️ Multiple KPIs in same branch (need to handle conflicts)
- ⚠️ PR workflow changes (staging → main instead of feature → main)

---

## Implementation Options

### Option 1: User Token for Staging Commits

**If user can commit to staging branch:**
```typescript
// Use user token for commits to staging
const userOctokit = new Octokit({ auth: userToken });

await userOctokit.repos.createOrUpdateFileContents({
  branch: 'staging',  // Single staging branch
  // ... commit details
});
```

**Benefits:**
- ✅ Commits made by user (not App) → will count toward contributions
- ✅ No need for App (except maybe branch creation)

**Requirements:**
- User must have write access to staging branch
- Staging branch must exist (or user can create it)
- User token must have `repo` scope

### Option 2: App Creates Commits, User Merges

**Keep App for commits, but user manually merges:**
```typescript
// App creates commits to staging
await appOctokit.repos.createOrUpdateFileContents({
  branch: 'staging',
  // ... commit details
});

// User manually merges PR from staging → main
// This merge might count as user contribution
```

**Benefits:**
- ✅ Works in org repos (App has write access)
- ✅ User merge might count as contribution

**Limitations:**
- ⚠️ Commits still made by App (might not count)
- ⚠️ Only the merge might count (not the commits)

---

## GitHub Contribution Rules

**What Counts:**
1. Commits made directly by user (not App/Bot)
2. Commits merged to default branch (main)
3. Author email matches verified email

**What Doesn't Count:**
1. Commits made by App/Bot (even with user attribution)
2. Commits on non-default branches (until merged)
3. Merges might count if done by user

---

## Recommended Approach

### Hybrid: User Token for Staging, App for Branch Creation

**If staging branch exists and user has write access:**

1. **Check if staging branch exists:**
   ```typescript
   try {
     await userOctokit.repos.getBranch({
       owner: GITHUB_OWNER,
       repo: GITHUB_CONTENT_REPO,
       branch: 'staging',
     });
     // Staging exists, use user token
   } catch {
     // Staging doesn't exist, create with App
   }
   ```

2. **Use user token for commits to staging:**
   ```typescript
   const userOctokit = new Octokit({ auth: userToken });
   await userOctokit.repos.createOrUpdateFileContents({
     branch: 'staging',
     // ... commit as user
   });
   ```

3. **User manually merges PR from staging → main:**
   - This merge will definitely count as user contribution
   - User has control over what gets merged

**Benefits:**
- ✅ Commits to staging made by user → count toward contributions
- ✅ Merge to main by user → counts as contribution
- ✅ Works if user has write access to staging branch

---

## Implementation Changes Needed

### 1. Branch Name Logic

**Current:**
```typescript
const branchName = `${params.action}-${params.tableName}-${branchIdentifier}-${Date.now()}`;
```

**New:**
```typescript
const branchName = 'staging';  // Single staging branch
```

### 2. PR Creation Logic

**Current:**
- Creates PR from feature branch → main

**New:**
- Option A: No PR (user commits directly to staging, then manually merges)
- Option B: Create PR from staging → main (user reviews and merges)

### 3. Conflict Handling

**Multiple KPIs in same branch:**
- Need to handle merge conflicts
- Use file paths to avoid conflicts (each KPI has unique file path)
- Or use sequential commits (wait for previous commit to complete)

---

## Testing Plan

1. **Check if user can create/commit to staging branch:**
   ```typescript
   // Test with user token
   const userOctokit = new Octokit({ auth: userToken });
   try {
     await userOctokit.repos.getBranch({ branch: 'staging' });
     // Can access staging
   } catch {
     // Cannot access, need App
   }
   ```

2. **Test commit to staging:**
   - Try committing with user token
   - Check if commit shows as user (not App)
   - Verify contribution counts

3. **Test merge:**
   - User manually merges staging → main
   - Check if merge counts as contribution

---

## Code Changes Required

### 1. Environment Variable

Add optional staging branch name:
```env
GITHUB_STAGING_BRANCH=staging  # Optional, defaults to per-KPI branches
```

### 2. Branch Selection Logic

```typescript
const useStagingBranch = process.env.GITHUB_STAGING_BRANCH || false;
const branchName = useStagingBranch 
  ? process.env.GITHUB_STAGING_BRANCH 
  : `${params.action}-${params.tableName}-${branchIdentifier}-${Date.now()}`;
```

### 3. Token Selection

```typescript
// If staging branch, try user token first
if (branchName === 'staging') {
  try {
    // Use user token for staging commits
    const userOctokit = new Octokit({ auth: userToken });
    // ... commit to staging
  } catch {
    // Fallback to App if user token fails
  }
} else {
  // Use App for feature branches (org repo requirement)
  // ... existing logic
}
```

---

## Summary

**Staging branch approach could solve the contribution issue IF:**
1. User has write access to staging branch in org repo
2. User token can commit to staging
3. Commits to staging count toward contributions
4. User manually merges (counts as contribution)

**This is worth trying because:**
- ✅ Simpler workflow
- ✅ User has control
- ✅ Might solve contribution counting issue
- ✅ Fewer PRs to manage

**Next Steps:**
1. Test if user can commit to staging branch
2. Implement staging branch logic
3. Test if commits count toward contributions
4. Compare with current approach

