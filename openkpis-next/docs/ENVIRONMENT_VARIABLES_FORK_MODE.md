# Environment Variables - Fork Mode

## GITHUB_FORK_MODE_ENABLED

**Type:** `boolean` (string: `"true"` or `"false"`)

**Default:** `false` (if not set)

**Purpose:** Feature flag to enable/disable the fork+PR contribution mode.

### Usage

Add to `.env.local`:

```bash
GITHUB_FORK_MODE_ENABLED=true
```

Add to Vercel Environment Variables:
- Key: `GITHUB_FORK_MODE_ENABLED`
- Value: `true`

### Behavior

- **`true`**: Fork+PR mode is available. Users can opt-in via preference.
- **`false` or not set**: All users use `internal_app` mode (Quick Create) regardless of preference.

### When to Enable

- ✅ **DEV environment**: Enable for testing
- ✅ **PROD environment**: Enable when ready for users

### When to Disable

- ⚠️ If fork creation is causing issues
- ⚠️ If GitHub API rate limits are hit
- ⚠️ During maintenance

## Related Variables

These are still required (existing):

- `GITHUB_APP_ID`
- `GITHUB_INSTALLATION_ID`
- `GITHUB_APP_PRIVATE_KEY_B64`
- `GITHUB_REPO_OWNER`
- `GITHUB_CONTENT_REPO_NAME` or `GITHUB_CONTENT_REPO`

