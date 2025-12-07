# Why GraphQL API Doesn't Help with Contributions

## The Misconception

**Belief:** Using GraphQL `createCommitOnBranch` instead of REST API will make commits count toward contributions.

**Reality:** The API type doesn't matter - what matters is **WHO authenticates the request**.

---

## How GitHub Counts Contributions

**GitHub checks:**
1. **Who made the commit?** (App/Bot vs User)
2. **Author email matches verified email?**
3. **Commit is on main branch?**
4. **Repository is non-forked?**

**GitHub does NOT check:**
- ❌ Which API was used (REST vs GraphQL)
- ❌ How the commit was created (API vs Git)
- ❌ The commit message format

---

## GraphQL vs REST - Same Result

### REST API with App Token:
```typescript
const appOctokit = new Octokit({
  authStrategy: createAppAuth,
  auth: { appId, privateKey, installationId }
});
await appOctokit.repos.createOrUpdateFileContents({...});
// Result: App commit → Doesn't count
```

### GraphQL API with App Token:
```typescript
await graphql(`mutation { createCommitOnBranch(...) }`, {
  headers: { authorization: `token ${appToken}` }
});
// Result: App commit → Doesn't count (same as REST!)
```

**Both produce the same result: App commit that doesn't count.**

---

## What Actually Helps

### REST API with User Token:
```typescript
const userOctokit = new Octokit({ auth: userToken });
await userOctokit.repos.createOrUpdateFileContents({...});
// Result: User commit → Counts!
```

### GraphQL API with User Token:
```typescript
await graphql(`mutation { createCommitOnBranch(...) }`, {
  headers: { authorization: `token ${userToken}` }
});
// Result: User commit → Counts! (same as REST!)
```

**Both produce the same result: User commit that counts.**

---

## The Real Issue

**Current Problem:**
- Using App token (even with user attribution)
- App commits don't count

**Solution:**
- Use user token (not App token)
- User commits count

**API Type:** Doesn't matter - REST and GraphQL work the same

---

## Why Draft Folder Approach Helps

**Draft folder approach helps because:**
1. ✅ Commits directly to main (counts immediately)
2. ✅ Can use user token (if user is collaborator)
3. ✅ Simpler workflow (no branches/PRs)

**Not because of API type, but because:**
- Commits are on main branch
- Can potentially use user token

---

## Conclusion

**GraphQL API doesn't solve the contribution issue because:**
- ❌ Still requires App token (if user not collaborator)
- ❌ App commits don't count (regardless of API)
- ✅ User token works with both APIs

**The solution is:**
- ✅ Use user token (not App token)
- ✅ Make users collaborators (if org repo)
- ✅ Commit to main branch (draft folder approach)

**Stick with REST API - it works the same as GraphQL for contributions!**

