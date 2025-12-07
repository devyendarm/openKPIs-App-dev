# GraphQL API Analysis - Does It Help with Contributions?

## Key Question

**Does using GraphQL `createCommitOnBranch` instead of REST API help with contributions?**

## Answer: Probably Not

**Why:**
- GitHub counts contributions based on **WHO makes the commit** (App vs User), not which API is used
- GraphQL API still requires authentication (App token or User token)
- If App token is used → still App commit → won't count
- If User token is used → user commit → will count

**The API type (REST vs GraphQL) doesn't change contribution counting.**

---

## What Actually Matters for Contributions

1. **Authentication Method:**
   - ✅ User token → Commits count
   - ❌ App token → Commits don't count (even with user attribution)

2. **Author Email:**
   - ✅ Must match verified email on GitHub account

3. **Branch:**
   - ✅ Commits to main count immediately
   - ⚠️ Commits to feature branches only count after merge

4. **Repository:**
   - ✅ Must be non-forked repository
   - ✅ User must be collaborator or org member (for org repos)

---

## GraphQL vs REST API

### Current Implementation (REST API):
```typescript
// Using @octokit/rest
const octokit = new Octokit({ auth: appToken });
await octokit.repos.createOrUpdateFileContents({
  // ... commit details
});
```

### GraphQL Alternative:
```typescript
// Using @octokit/graphql
const { graphql } = require("@octokit/graphql");
const result = await graphql(`
  mutation CreateCommit {
    createCommitOnBranch(input: {
      branch: {
        repositoryNameWithOwner: "organization/repo",
        branchName: "main"
      },
      message: { headline: "My commit" },
      fileChanges: {
        additions: [{
          path: "file.txt",
          contents: "base64content"
        }]
      },
      expectedHeadOid: "sha"
    }) {
      commit { url }
    }
  }
`, {
  headers: {
    authorization: `token ${appToken}`,  // Still using App token!
  },
});
```

**Problem:** Still using App token → still App commit → won't count

---

## When GraphQL Might Help

**GraphQL could help IF:**
1. We use **user token** (not App token)
2. User is a **collaborator** (can commit to main)
3. Commit is to **main branch**

**But:** REST API works the same way with user token!

---

## The Real Solution

**Not about API type, but about authentication:**

### Option 1: Use User Token (REST or GraphQL)
```typescript
// REST API with user token
const userOctokit = new Octokit({ auth: userToken });
await userOctokit.repos.createOrUpdateFileContents({
  branch: 'main',
  // ... commit as user
});
// ✅ Counts toward contributions
```

```typescript
// GraphQL API with user token
await graphql(`mutation { ... }`, {
  headers: { authorization: `token ${userToken}` }
});
// ✅ Also counts toward contributions
```

**Both work the same!**

### Option 2: Make User Collaborator
- Add user as collaborator to org repo
- User token can then commit to main
- Commits will count

---

## Recommendation

**Stick with REST API (current):**
- ✅ Already implemented
- ✅ Works the same as GraphQL for contributions
- ✅ Simpler (no GraphQL learning curve)
- ✅ Better documentation

**Focus on:**
- ✅ Using user token instead of App token
- ✅ Making users collaborators (if needed)
- ✅ Committing to main branch (draft folder approach)

---

## Summary

**GraphQL API doesn't help with contributions because:**
- ❌ Still requires App token (if user not collaborator)
- ❌ App commits don't count (regardless of API)
- ✅ User token works with both REST and GraphQL

**The solution is:**
- ✅ Use user token (not App token)
- ✅ Make users collaborators (if org repo)
- ✅ Commit to main branch (draft folder approach)

**GraphQL is not the answer - user token is!**

