# Staging Branch Implementation Plan

## Why This Could Solve the Issue

**Current Problem:**
- App commits don't count toward contributions (even with user attribution)
- Each KPI creates its own branch and PR
- Complex workflow

**Staging Branch Solution:**
- ✅ User commits directly to staging (if user has write access)
- ✅ User manually merges staging → main (definitely counts as contribution)
- ✅ Simpler workflow
- ✅ User has control

---

## Implementation Steps

### Step 1: Check User Access to Staging Branch

**Test if user can commit to staging:**
```typescript
// In commitWithUserToken function
const userOctokit = new Octokit({ auth: userToken });

// Try to get staging branch
try {
  await userOctokit.repos.getBranch({
    owner: GITHUB_OWNER,
    repo: GITHUB_CONTENT_REPO,
    branch: 'staging',
  });
  // Staging exists, user can access it
  console.log('[GitHub Sync] Staging branch exists, using user token');
} catch (error) {
  // Staging doesn't exist or user can't access
  // Create staging branch with App, then try user commits
  console.log('[GitHub Sync] Staging branch not accessible, creating with App');
}
```

### Step 2: Modify Branch Name Logic

**Current:**
```typescript
const branchName = `${params.action}-${params.tableName}-${branchIdentifier}-${Date.now()}`;
```

**New:**
```typescript
// Use environment variable to enable staging branch
const USE_STAGING_BRANCH = process.env.GITHUB_USE_STAGING_BRANCH === 'true';
const STAGING_BRANCH_NAME = process.env.GITHUB_STAGING_BRANCH || 'staging';

const branchName = USE_STAGING_BRANCH 
  ? STAGING_BRANCH_NAME 
  : `${params.action}-${params.tableName}-${branchIdentifier}-${Date.now()}`;
```

### Step 3: Use User Token for Staging Commits

**If staging branch:**
```typescript
if (branchName === STAGING_BRANCH_NAME) {
  // Try user token first
  try {
    const userOctokit = new Octokit({ auth: userToken });
    
    // Check if file exists (for updates)
    let existingFileSha: string | undefined;
    try {
      const { data: existingFile } = await userOctokit.repos.getContent({
        owner: GITHUB_OWNER,
        repo: GITHUB_CONTENT_REPO,
        path: filePath,
        ref: branchName,
      });
      if (existingFile && typeof existingFile === 'object' && 'sha' in existingFile) {
        existingFileSha = existingFile.sha as string;
      }
    } catch {
      // File doesn't exist - new file
    }
    
    // Commit with user token
    const commitResponse = await userOctokit.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo: GITHUB_CONTENT_REPO,
      path: filePath,
      message: params.action === 'created'
        ? `Add ${params.tableName.slice(0, -1)}: ${params.record.name}`
        : `Update ${params.tableName.slice(0, -1)}: ${params.record.name}`,
      content: Buffer.from(yamlContent).toString('base64'),
      branch: branchName,
      sha: existingFileSha,
      author: {
        name: authorName,
        email: authorEmail,
      },
      committer: {
        name: authorName,
        email: authorEmail,
      },
    });
    
    console.log('[GitHub Sync] Commit created to staging using USER TOKEN - will count toward contributions');
    // No PR needed - user will manually merge staging → main
    return {
      success: true,
      commit_sha: commitResponse.data.commit.sha,
      branch: branchName,
      file_path: filePath,
      // No PR number/URL since we're not creating PR
    };
  } catch (error) {
    // User token failed, fallback to App
    console.warn('[GitHub Sync] User token failed for staging, falling back to App');
    // Continue with App approach
  }
}
```

### Step 4: Handle PR Creation

**Option A: No PR (Recommended for Staging)**
- Commits go directly to staging
- User manually merges staging → main via GitHub UI
- No PR needed

**Option B: Create PR from Staging → Main**
- Create PR but don't auto-merge
- User reviews and merges manually
- This merge will count as user contribution

**Implementation:**
```typescript
// Only create PR if NOT using staging branch
if (branchName !== STAGING_BRANCH_NAME) {
  // Create PR as usual
  const prResponse = await appOctokit.pulls.create({
    owner: GITHUB_OWNER,
    repo: GITHUB_CONTENT_REPO,
    title: params.action === 'created'
      ? `Add ${params.tableName.slice(0, -1)}: ${params.record.name}`
      : `Update ${params.tableName.slice(0, -1)}: ${params.record.name}`,
    head: branchName,
    base: 'main',
    body: prBody,
    maintainer_can_modify: true,
  });
  // ... handle PR
} else {
  // Staging branch - no PR, user will manually merge
  console.log('[GitHub Sync] Staging branch - no PR created, user will manually merge');
}
```

### Step 5: Update Webhook Handler

**Current webhook expects branch format:** `{action}-{tableName}-{slug}-{timestamp}`

**For staging branch, need different logic:**
```typescript
// In webhook handler
const branchName = pr.head.ref;

if (branchName === 'staging') {
  // Extract from file path instead of branch name
  // PR files: data-layer/kpis/my-kpi.yml
  // Extract: kpis, my-kpi
  const files = pr.files || [];
  // ... extract table name and slug from file path
} else {
  // Use existing branch name parsing
  // ... existing logic
}
```

---

## Environment Variables

**Add to Vercel:**
```env
# Enable staging branch approach
GITHUB_USE_STAGING_BRANCH=true

# Staging branch name (optional, defaults to 'staging')
GITHUB_STAGING_BRANCH=staging
```

---

## Benefits

1. **User Commits Count:**
   - If user can commit to staging, commits will count
   - User merge from staging → main will definitely count

2. **Simpler Workflow:**
   - One branch instead of many
   - User has control over what gets merged

3. **Fewer PRs:**
   - No PR per KPI
   - User manually merges selected items

4. **Works in Org Repos:**
   - If user has write access to staging branch
   - Or App creates staging, user commits to it

---

## Potential Issues

1. **User Access:**
   - User might not have write access to staging in org repo
   - Solution: Make user a collaborator or use App for commits

2. **Conflicts:**
   - Multiple KPIs in same branch might conflict
   - Solution: Each KPI has unique file path, so no conflicts

3. **Webhook Updates:**
   - Need to update webhook to handle staging branch
   - Solution: Extract info from file path instead of branch name

---

## Testing Plan

1. **Test user access to staging:**
   - Try to get/create staging branch with user token
   - If fails, use App to create it

2. **Test commit to staging:**
   - Commit with user token
   - Verify commit shows as user (not App)
   - Check if contribution counts

3. **Test manual merge:**
   - User merges staging → main
   - Verify merge counts as contribution

---

## Code Changes Summary

1. ✅ Add environment variable for staging branch
2. ✅ Modify branch name logic
3. ✅ Add user token commit logic for staging
4. ✅ Skip PR creation for staging
5. ✅ Update webhook handler for staging branch

---

## Next Steps

1. **Test if user can access staging branch**
2. **Implement staging branch logic**
3. **Test if commits count toward contributions**
4. **Compare with current approach**

This approach could solve the contribution issue if user has write access to staging branch!

