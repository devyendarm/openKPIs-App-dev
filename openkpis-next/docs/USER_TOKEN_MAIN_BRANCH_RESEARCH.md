# User Token to Main Branch - Research Findings

## GitHub's Rules for Organization Repositories

### Key Finding: Branch Creation vs. Direct Commits

**GitHub's Limitation:**
- Users with `repo` scope **CANNOT create branches** in organization repositories (unless they are collaborators)
- **BUT:** Users **CAN commit directly to existing branches** (like `main`) if they have write access

### When User Token Can Commit to Main

**User token CAN commit to main if:**
1. ✅ User is a **collaborator** on the repository
2. ✅ User is a **member** of the organization that owns the repository
3. ✅ Repository is **public** AND user has `repo` scope (for public repos, this works)
4. ✅ User has been granted **write access** to the repository

**User token CANNOT commit to main if:**
1. ❌ User is not a collaborator AND not an org member
2. ❌ Repository has **branch protection rules** that prevent direct commits
3. ❌ User only has `read` access (not `write`)

---

## For Organization Repositories

**The Challenge:**
- Organization repos require users to be **collaborators** or **org members** to have write access
- Even with `repo` scope, users can't create branches unless they're collaborators
- **BUT:** If user is a collaborator, they CAN commit directly to main

**The Solution:**
1. **Option A:** Make users collaborators (one-time per user)
2. **Option B:** Use GitHub App for commits (current approach)
3. **Option C:** Try user token first, fallback to App if it fails

---

## Research Summary

### Can User Token Commit to Main in Org Repos?

**Answer: YES, IF user is a collaborator or org member**

**Evidence from GitHub Docs:**
- Commits to main branch count toward contributions **immediately**
- User commits (not App) **definitely count**
- Users with `repo` scope can commit to existing branches if they have write access
- Organization repos require collaborator/org member status for write access

**For Public Repositories:**
- Users with `repo` scope can commit to main **if they're collaborators**
- Public repos are more permissive, but still require collaborator status for write access

---

## Recommended Approach

### Try User Token First, Fallback to App

**Implementation Strategy:**
1. **Try user token** to commit to main (draft folder)
2. **If it fails** (404/403), fallback to GitHub App
3. **Log the result** so we know which method was used

**Benefits:**
- ✅ If user is collaborator → commits count (user token)
- ✅ If user is not collaborator → still works (App fallback)
- ✅ No breaking changes
- ✅ Can test with real users

---

## Testing Plan

### Test 1: User Token to Main

```typescript
// Try user token first
const userOctokit = new Octokit({ auth: userToken });
try {
  await userOctokit.repos.createOrUpdateFileContents({
    branch: 'main',
    path: 'data-layer-draft/kpis/test.yml',
    // ... commit details
  });
  console.log('✅ User token worked - commit will count!');
} catch (error) {
  if (error.status === 404 || error.status === 403) {
    console.log('⚠️ User token failed - user not a collaborator, using App');
    // Fallback to App
  }
}
```

### Test 2: Check User Status

**Check if user is collaborator:**
```typescript
try {
  const { data: repo } = await userOctokit.repos.get({
    owner: GITHUB_OWNER,
    repo: GITHUB_CONTENT_REPO,
  });
  // If this succeeds, user has read access
  // Try commit to see if they have write access
} catch {
  // User doesn't have access
}
```

---

## Conclusion

**User token CAN commit to main IF:**
- User is a collaborator or org member
- Repository allows direct commits to main
- User has `repo` scope

**For our use case:**
- Try user token first (best case - commits count)
- Fallback to App if user token fails (still works, but might not count)
- This gives us the best of both worlds

**Next Step:** Implement draft folder approach with user token first, App fallback.

