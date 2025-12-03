# Production Readiness Checklist

## ✅ Completed

### Security
- [x] Next.js updated to 15.5.7 (CVE-2025-55182 fixed)
- [x] @supabase/ssr updated to 0.8.0 (cookie vulnerability fixed)
- [x] js-yaml updated to 4.1.1 (security fix)
- [x] xlsx removed (unfixable vulnerabilities)
- [x] All TypeScript errors resolved
- [x] All ESLint warnings fixed

### Database
- [x] Production RLS enabled on `prod_user_profiles`
- [x] Production RLS policies applied to all `prod_*` tables
- [x] Helper functions created (`is_admin_or_editor_prod`, `get_user_identifiers_prod`)

### Code Quality
- [x] No unused imports
- [x] No `any` types (replaced with proper types)
- [x] Proper error boundaries in place
- [x] Environment detection logic robust (NEXT_PUBLIC_APP_ENV → hostname → dev_)

### Features
- [x] Accordion component with single/multiple open modes
- [x] DataTable component
- [x] DataMappingsAccordion component
- [x] Events table with Platform/Event Name columns
- [x] Editor page access fixed for admins/editors

## ⚠️ Pre-Deployment Checklist

### Environment Variables
Ensure all production environment variables are set in Vercel:
- `NEXT_PUBLIC_APP_ENV=production` (or detect via hostname)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `NEXT_PUBLIC_GITHUB_REPO_OWNER`
- `NEXT_PUBLIC_GITHUB_APP_REPO_NAME`
- `NEXT_PUBLIC_GITHUB_CONTENT_REPO_NAME`
- All other required variables (see `docs/ENVIRONMENT_VARIABLES.md`)

### Database Verification
- [x] Run `verify-prod-rls-policies.sql` to confirm all policies are active
- [ ] Verify all `prod_*` tables exist
- [ ] Test admin user access in production
- [ ] Test editor user access in production

### Build Verification
- [ ] Run `npm run build` locally to ensure no build errors
- [ ] Run `npm run type-check` to ensure no TypeScript errors
- [ ] Run `npm run lint` to ensure no linting errors

### Testing
- [ ] Test KPI detail page loads correctly
- [ ] Test accordion expand/collapse functionality
- [ ] Test table rendering in Events section
- [ ] Test GitHub authentication
- [ ] Test editor page access (admin/editor roles)
- [ ] Test RLS policies (users can only see their own drafts)

## 📝 Notes

### Debug Routes
The following debug routes exist but are protected by authentication:
- `/api/debug/user-role` - Useful for troubleshooting role issues
- `/api/debug/profile-sync` - Useful for troubleshooting profile creation

These can remain in production as they require authentication and provide valuable debugging information.

### Console Logging
Some console.error and console.warn statements remain in production code (e.g., `AuthProvider.tsx`). These are intentional for production monitoring and error tracking.

## 🚀 Deployment Steps

1. **Verify Build Locally**
   ```bash
   npm run build
   npm run type-check
   npm run lint
   ```

2. **Commit All Changes**
   ```bash
   git add .
   git commit -m "Production release: Security updates, RLS policies, component improvements"
   git push origin main
   ```

3. **Deploy to Vercel**
   - Push will trigger automatic deployment
   - Monitor build logs for any issues
   - Verify environment variables are set correctly

4. **Post-Deployment Verification**
   - Test production URL
   - Verify RLS policies are working
   - Test admin/editor access
   - Monitor error logs

## 🔒 Security Notes

- All RLS policies are in place for production
- Environment variables are properly scoped (NEXT_PUBLIC_* for client, others for server)
- No sensitive data exposed in client-side code
- Supabase SSR client properly configured for production

