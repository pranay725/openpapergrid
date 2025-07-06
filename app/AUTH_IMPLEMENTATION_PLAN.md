# Authentication Implementation Plan

## Current Status
- ✅ Basic Supabase auth setup exists
- ✅ Login/signup pages present
- ✅ Rate limiting utility created
- ✅ Database migration for rate limits prepared
- ✅ Middleware updated with auth & rate limiting
- ✅ UI components updated for auth state

## Phase 1: Complete Basic Auth (This Week)

### 1.1 Update Header Component
```tsx
// components/Header.tsx
- Add user menu with avatar
- Show sign in/sign up buttons for anonymous
- Display user email when logged in
- Add logout functionality
```

### 1.2 Enhance Auth Pages
```tsx
// app/auth/login/page.tsx
- Add OAuth providers (Google, GitHub)
- Implement "Remember me" functionality
- Add password reset link
- Handle redirect after login

// app/auth/signup/page.tsx
- Add OAuth options
- Email verification flow
- Terms of service checkbox
```

### 1.3 API Route Protection
```typescript
// Update each API route to check auth
- /api/fulltext - Require auth
- /api/ai/extract - Check mode & limit
- /api/search - Apply rate limits
```

## Phase 2: Usage Tracking (Next Week)

### 2.1 Track Anonymous Usage
```typescript
// lib/usage-tracker.ts
export async function trackAnonymousUsage(
  ip: string,
  action: 'search' | 'extraction'
) {
  // Store in localStorage + server
  // Show usage indicators
}
```

### 2.2 User Dashboard
```tsx
// app/dashboard/page.tsx
- Usage statistics
- Saved configurations
- Search history
- Export options
```

### 2.3 Usage Indicators
- Add UsageLimitIndicator to search page
- Show remaining extractions
- Upgrade prompts at strategic points

## Phase 3: Feature Gating

### 3.1 Search Results Limiting
```typescript
// For anonymous users
if (!session && results.length > 50) {
  results = results.slice(0, 50);
  showUpgradePrompt = true;
}
```

### 3.2 Configuration Management
```typescript
// Disable save for anonymous
if (!session) {
  saveButton.disabled = true;
  saveButton.title = "Sign in to save configurations";
}
```

### 3.3 Export Restrictions
```typescript
// Block export for anonymous
if (!session && action === 'export') {
  return showSignInModal();
}
```

## Phase 4: Polish & Optimization

### 4.1 Performance
- Cache auth state in context
- Optimize rate limit checks
- Batch usage tracking

### 4.2 User Experience
- Smooth auth flows
- Clear error messages
- Progress indicators
- Success celebrations

### 4.3 Security
- CSRF protection
- Rate limit bypass prevention
- Secure session management
- API key rotation

## Implementation Checklist

### Immediate Actions (Today)
- [ ] Run database migration
- [ ] Update Header component
- [ ] Add auth context provider
- [ ] Test rate limiting

### This Week
- [ ] Complete auth pages
- [ ] Add usage tracking
- [ ] Implement feature gates
- [ ] Add usage indicators

### Next Week
- [ ] User dashboard
- [ ] Export functionality
- [ ] Email notifications
- [ ] Analytics integration

## Testing Plan

### Manual Testing
1. Anonymous user flow
2. Sign up process
3. Login with redirect
4. Rate limit enforcement
5. Feature access control

### Automated Tests
```typescript
// __tests__/auth.test.ts
- Rate limit logic
- Auth middleware
- Feature gating
- Usage tracking
```

## Monitoring & Analytics

### Track Key Metrics
- Sign up conversion rate
- Feature usage by auth state
- Rate limit hits
- Upgrade conversions

### Error Monitoring
- Auth failures
- Rate limit errors
- API access attempts
- Session issues

## Rollback Plan
1. Feature flags for gradual rollout
2. Database backups before migration
3. Quick disable switches
4. Fallback to no auth mode 