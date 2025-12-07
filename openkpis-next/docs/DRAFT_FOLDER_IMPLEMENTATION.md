# Draft Folder Implementation Plan

## Research Summary

**User Token to Main Branch:**
- ✅ User token CAN commit to main IF user is a collaborator or org member
- ✅ Commits to main count immediately (no PR merge needed)
- ✅ User commits definitely count toward contributions
- ⚠️ If user is not a collaborator, fallback to App

**Implementation Strategy:**
1. Try user token first (best case - commits count)
2. Fallback to App if user token fails (still works)
3. Use draft folder: `data-layer-draft/` for new items
4. Commit directly to main branch
5. No PR creation needed

---

## Code Changes

### 1. Add Environment Variable

**Add to `.env.local` and Vercel:**
```env
# Enable draft folder approach (commit directly to main in draft folder)
GITHUB_USE_DRAFT_FOLDER=true
```

### 2. Modify `commitWithUserToken` Function

**Add draft folder logic:**
```typescript
// Check if draft folder approach is enabled
const USE_DRAFT_FOLDER = process.env.GITHUB_USE_DRAFT_FOLDER === 'true';

// Determine file path and branch
const filePath = USE_DRAFT_FOLDER
  ? `data-layer-draft/${params.tableName}/${fileName}`  // Draft folder
  : `data-layer/${params.tableName}/${fileName}`;        // Regular folder

const branchName = USE_DRAFT_FOLDER
  ? 'main'  // Direct to main
  : `${params.action}-${params.tableName}-${branchIdentifier}-${Date.now()}`;  // Feature branch
```

### 3. Try User Token First (for Draft Folder)

**If draft folder and main branch:**
```typescript
if (USE_DRAFT_FOLDER && branchName === 'main') {
  // Try user token first (commits will count)
  try {
    const userOctokit = new Octokit({ auth: userToken });
    
    // Check if file exists
    let existingFileSha: string | undefined;
    try {
      const { data: existingFile } = await userOctokit.repos.getContent({
        owner: GITHUB_OWNER,
        repo: GITHUB_CONTENT_REPO,
        path: filePath,
        ref: 'main',
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
        ? `Add draft ${params.tableName.slice(0, -1)}: ${params.record.name}`
        : `Update draft ${params.tableName.slice(0, -1)}: ${params.record.name}`,
      content: Buffer.from(yamlContent).toString('base64'),
      branch: 'main',
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
    
    console.log('[GitHub Sync] Commit created to main using USER TOKEN - will count toward contributions!');
    
    // No PR needed for draft folder approach
    return {
      success: true,
      commit_sha: commitResponse.data.commit.sha,
      branch: 'main',
      file_path: filePath,
      // No pr_number or pr_url
    };
  } catch (error) {
    const err = error as { status?: number; message?: string };
    console.warn('[GitHub Sync] User token failed for main branch:', {
      status: err.status,
      message: err.message,
    });
    
    // If 404/403, user is not a collaborator - fallback to App
    if (err.status === 404 || err.status === 403) {
      console.log('[GitHub Sync] User not a collaborator, falling back to App');
      // Continue with App approach below
    } else {
      // Other error - throw it
      throw error;
    }
  }
}
```

### 4. Fallback to App (if user token fails)

**Continue with existing App logic:**
```typescript
// If user token failed or draft folder disabled, use App
// ... existing App commit logic
```

### 5. Skip PR Creation for Draft Folder

**Modify PR creation:**
```typescript
// Only create PR if NOT using draft folder
if (!USE_DRAFT_FOLDER) {
  // Create PR as usual
  const prResponse = await appOctokit.pulls.create({
    // ... PR creation
  });
} else {
  // Draft folder - no PR needed
  console.log('[GitHub Sync] Draft folder approach - no PR created');
}
```

---

## Testing Steps

1. **Set environment variable:**
   ```env
   GITHUB_USE_DRAFT_FOLDER=true
   ```

2. **Create a KPI:**
   - Should commit to `data-layer-draft/kpis/{slug}.yml`
   - Should commit to `main` branch
   - Should try user token first

3. **Check logs:**
   - Look for: "Commit created to main using USER TOKEN"
   - Or: "User not a collaborator, falling back to App"

4. **Verify commit:**
   - Check GitHub: commit should be on main branch
   - Check file location: should be in `data-layer-draft/`
   - Check author: should be user (if user token worked)

5. **Check contributions:**
   - If user token worked → should count immediately
   - If App was used → might not count (known issue)

---

## Next Steps After Testing

1. **If user token works:**
   - ✅ Contributions will count!
   - ✅ Can keep this approach

2. **If user token fails:**
   - ⚠️ Need to make users collaborators
   - ⚠️ Or keep App approach (contributions might not count)

3. **Add Publish API:**
   - Move file from `data-layer-draft/` → `data-layer/`
   - This will be another commit (also counts if user token works)

---

## Summary

**Implementation:**
- ✅ Add `GITHUB_USE_DRAFT_FOLDER` environment variable
- ✅ Modify file path to use `data-layer-draft/`
- ✅ Change branch to `main` for draft folder
- ✅ Try user token first, fallback to App
- ✅ Skip PR creation for draft folder

**Benefits:**
- ✅ Commits to main count immediately
- ✅ User commits definitely count
- ✅ Simpler workflow (no branches/PRs)
- ✅ Can test with real users

