# Authentication Strategy for OpenPaperGrid

## Overview
Balance between allowing users to experience the product and protecting against abuse while incentivizing sign-ups.

## Feature Access Matrix

### Anonymous Users (Not Logged In)

| Feature | Access Level | Rate Limit | Notes |
|---------|--------------|------------|--------|
| **Search** | ✅ Limited | 10 searches/hour | Track by IP |
| **View Results** | ✅ Limited | Max 50 papers/search | Show "Sign in for more" |
| **Filters** | ✅ Basic | - | Year, Open Access only |
| **Abstract Extraction** | ✅ Limited | 5 papers/hour | Demo AI capabilities |
| **Full Text Extraction** | ❌ Disabled | - | "Sign in required" |
| **View Configurations** | ✅ Demo only | - | Show default config |
| **Create Configurations** | ❌ Disabled | - | "Sign in to save" |
| **Export Results** | ❌ Disabled | - | "Sign in to export" |
| **Save Searches** | ❌ Disabled | - | "Sign in to save" |
| **API Access** | ❌ Disabled | - | Auth required |

### Authenticated Users (Logged In)

| Feature | Access Level | Rate Limit | Notes |
|---------|--------------|------------|--------|
| **Search** | ✅ Full | 1000 searches/day | Generous limit |
| **View Results** | ✅ Full | Unlimited | All results |
| **Filters** | ✅ Full | - | All filter options |
| **Abstract Extraction** | ✅ Full | 500 papers/day | Monitor usage |
| **Full Text Extraction** | ✅ Full | 100 papers/day | Higher cost |
| **View Configurations** | ✅ Full | - | All configs |
| **Create Configurations** | ✅ Full | 10 configs | Expandable |
| **Export Results** | ✅ Full | - | CSV, JSON |
| **Save Searches** | ✅ Full | 50 saved | History |
| **API Access** | ✅ Full | 10k calls/month | Tiered |

## Implementation Details

### 1. Rate Limiting Strategy

```typescript
// Rate limit keys
const RATE_LIMITS = {
  anonymous: {
    search: { limit: 10, window: '1h', key: 'ip' },
    abstractExtraction: { limit: 5, window: '1h', key: 'ip' },
    resultsPerSearch: 50
  },
  authenticated: {
    search: { limit: 1000, window: '24h', key: 'userId' },
    abstractExtraction: { limit: 500, window: '24h', key: 'userId' },
    fullTextExtraction: { limit: 100, window: '24h', key: 'userId' },
    apiCalls: { limit: 10000, window: '30d', key: 'userId' }
  }
};
```

### 2. UI/UX Considerations

#### Anonymous User Experience
1. **Soft Barriers**: Allow basic usage to demonstrate value
2. **Clear CTAs**: "Sign in for unlimited access" buttons
3. **Feature Teasers**: Show locked features with explanations
4. **Progress Indicators**: "3 of 5 free extractions used"

#### Sign-up Incentives
1. **Value Props**: 
   - "Get full text extraction"
   - "Save your configurations"
   - "Export unlimited results"
2. **Social Proof**: "Join 10,000+ researchers"
3. **Quick Sign-up**: OAuth with Google/GitHub

### 3. Technical Implementation

#### Middleware Checks
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const session = await getSession(request);
  const path = request.nextUrl.pathname;
  
  // Check authentication for protected routes
  if (PROTECTED_ROUTES.includes(path) && !session) {
    return NextResponse.redirect('/auth/login');
  }
  
  // Apply rate limiting
  const rateLimitResult = await checkRateLimit(request, session);
  if (!rateLimitResult.allowed) {
    return new NextResponse('Rate limit exceeded', { status: 429 });
  }
  
  return NextResponse.next();
}
```

#### API Protection
```typescript
// API route protection
export async function POST(request: NextRequest) {
  const session = await getServerSession();
  
  // Full text requires auth
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required for full text extraction' },
      { status: 401 }
    );
  }
  
  // Check rate limits
  const canExtract = await checkUserLimit(session.user.id, 'fulltext');
  if (!canExtract) {
    return NextResponse.json(
      { error: 'Daily limit reached. Upgrade for more.' },
      { status: 429 }
    );
  }
  
  // Process request...
}
```

### 4. Database Schema Updates

```sql
-- Rate limiting table
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP or user_id
  action TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- User usage stats
CREATE TABLE user_usage (
  user_id UUID REFERENCES auth.users(id),
  date DATE DEFAULT CURRENT_DATE,
  searches INTEGER DEFAULT 0,
  abstract_extractions INTEGER DEFAULT 0,
  fulltext_extractions INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, date)
);
```

### 5. Component Updates

#### SearchHeader Component
```tsx
{!session && searchCount >= 8 && (
  <Alert className="mt-2">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      You have {10 - searchCount} free searches remaining. 
      <Link href="/auth/login" className="underline ml-1">
        Sign in for unlimited access
      </Link>
    </AlertDescription>
  </Alert>
)}
```

#### ExtractionControls Component
```tsx
{!session && extractionMode === 'fulltext' && (
  <div className="flex items-center gap-2 text-sm text-amber-600">
    <Lock className="h-4 w-4" />
    Full text extraction requires sign in
    <Button size="sm" variant="outline" onClick={() => router.push('/auth/login')}>
      Sign In
    </Button>
  </div>
)}
```

## Migration Plan

### Phase 1: Basic Auth (Week 1)
- [ ] Implement Supabase auth
- [ ] Add login/signup pages
- [ ] Basic session management
- [ ] Update Header with user menu

### Phase 2: Rate Limiting (Week 2)
- [ ] Implement rate limiting middleware
- [ ] Add usage tracking
- [ ] Show usage indicators
- [ ] Handle rate limit errors gracefully

### Phase 3: Feature Gating (Week 3)
- [ ] Gate full text extraction
- [ ] Limit search results for anonymous
- [ ] Disable configuration saving
- [ ] Add upgrade prompts

### Phase 4: Polish (Week 4)
- [ ] Usage dashboard
- [ ] Billing integration (optional)
- [ ] Email notifications
- [ ] Analytics tracking

## Success Metrics
- Sign-up conversion rate > 15%
- Authenticated user retention > 60%
- Abuse incidents < 1%
- User satisfaction > 4.5/5 