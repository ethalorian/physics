# Deployment Checklist

## Pre-Deployment Steps

### 1. Environment Variables
Ensure all required environment variables are set in your deployment platform:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXTAUTH_SECRET=your_nextauth_secret_min_32_chars
NEXTAUTH_URL=https://your-production-domain.com
OPENAI_API_KEY=your_openai_key

# Optional
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key (for video metadata)
```

### 2. Database Setup
- [ ] Run Supabase migrations in production
- [ ] **CRITICAL**: Apply RLS security migration (`supabase/migrations/enable_rls_security.sql`)
- [ ] Update admin emails in `is_admin_or_teacher()` function
- [ ] Verify all tables exist
- [ ] Verify Row Level Security is enabled on all tables
- [ ] Create necessary indexes for performance
- [ ] Test permissions with different user roles

### 3. Authentication Configuration
- [ ] Update NextAuth allowed callback URLs in production
- [ ] Configure Google OAuth credentials for production domain
- [ ] Add admin/teacher emails to `src/lib/permissions.ts`

### 4. Build Verification
- [ ] Run `npm run build` locally to verify no build errors
- [ ] Check for TypeScript errors: `npx tsc --noEmit`
- [ ] Run linter: `npm run lint`
- [ ] Test all critical user flows

### 5. Performance Optimization
- [ ] Enable API caching (implemented in `src/lib/api-cache.ts`)
- [ ] Verify image optimization is enabled
- [ ] Check bundle size: `npm run build` and review .next/analyze output
- [ ] Enable compression in deployment platform

### 6. Security Review
- [ ] Verify all API routes have authentication checks
- [ ] Review permission checks in admin routes
- [ ] Ensure sensitive data is not exposed in client-side code
- [ ] Check CORS settings if needed
- [ ] Verify environment variables are not committed

### 7. Documentation
- [ ] Update README.md with production setup instructions
- [ ] Document API endpoints in docs/
- [ ] Keep essential feature documentation
- [ ] Remove development/migration docs (completed)

## Deployment Steps

### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
4. Deploy and verify

### Alternative Platforms
- **Netlify**: Similar process to Vercel
- **Railway**: Configure environment variables and deploy
- **Self-hosted**: Use Docker or PM2 for Node.js process management

## Post-Deployment Verification

### Functionality Tests
- [ ] User authentication (sign in/sign out)
- [ ] Student can view lessons
- [ ] Student can take assignments
- [ ] Teacher can create assignments
- [ ] Teacher can manage question bank
- [ ] Admin can access all features
- [ ] Vocabulary games work correctly
- [ ] Video playback and interactive questions work
- [ ] Real-time features (if any) are functional

### Performance Tests
- [ ] Page load times < 3 seconds
- [ ] API response times reasonable
- [ ] No console errors in browser
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

### Monitoring Setup
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Configure analytics (Google Analytics, Plausible, etc.)
- [ ] Set up uptime monitoring
- [ ] Configure database backups

## Rollback Plan
- Keep previous deployment available
- Document rollback procedure
- Have database backup before major changes
- Test rollback process

## Maintenance

### Regular Tasks
- Monitor error logs weekly
- Review performance metrics monthly
- Update dependencies quarterly
- Back up database weekly
- Review and rotate API keys as needed

### Content Updates
- Add new lessons regularly
- Expand question bank
- Update vocabulary terms
- Add new physics simulations

## Support

### User Roles
- **Admin**: Full access (emails in `src/lib/permissions.ts`)
- **Teacher**: Create/manage assignments, access question bank
- **Student**: View lessons, take assignments, play vocabulary games

### Common Issues
- **Authentication failures**: Check NEXTAUTH_URL and callback URLs
- **Database connection**: Verify Supabase credentials
- **API rate limits**: Monitor OpenAI API usage
- **Performance issues**: Check caching configuration

## Success Metrics
- User registration rate
- Assignment completion rate
- Average session duration
- Vocabulary game engagement
- Lesson view counts

---

**Deployment Date**: _________________

**Deployed By**: _________________

**Production URL**: _________________

**Version**: _________________
