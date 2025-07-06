# Security Implementation Guide

This document outlines the security measures implemented in OpenPaperGrid to protect against API abuse while maintaining anonymous access.

## Overview

OpenPaperGrid implements a multi-layered security approach that allows anonymous users to experience the app while protecting expensive API endpoints from abuse.

## Rate Limiting

### Anonymous Users
- **Search**: 50 requests per hour
- **Abstract Extraction**: 20 requests per hour
- **AI Chat**: 5 requests per hour (NEW)
- **AI Confidence**: 10 requests per hour (NEW)
- **Document Parsing**: 3 requests per hour (NEW)

### Authenticated Users
- **Search**: 1,000 requests per 24 hours
- **Abstract Extraction**: 500 requests per 24 hours
- **AI Chat**: 100 requests per 24 hours
- **AI Confidence**: 200 requests per 24 hours
- **Document Parsing**: 50 requests per 24 hours
- **Full Text Extraction**: 100 requests per 24 hours
- **Total API Calls**: 10,000 per 30 days

## API Protection

### 1. Protected Endpoints
The following endpoints now have rate limiting:
- `/api/search`
- `/api/ai/extract`
- `/api/ai/chat` ✅ (newly protected)
- `/api/ai/confidence` ✅ (newly protected)
- `/api/fulltext`
- `/api/scrape-abstract`
- `/api/parse` ✅ (newly protected)

### 2. Authentication Requirements
- `/api/fulltext` - Requires authentication
- `/api/ai/confidence` - Requires authentication
- All other endpoints allow anonymous access with rate limiting

### 3. Cost Reduction Measures
For anonymous users:
- AI Chat context limited to 6,000 characters (vs 12,000 for authenticated)
- AI Chat max tokens limited to 250 (vs 500 for authenticated)
- Stricter rate limits on all AI endpoints

## CORS Protection

### Security Headers
All API routes include:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### CORS Configuration
- Only allows requests from configured origins
- Supports credentials for authenticated requests
- Handles preflight requests properly

## Database Security

### Row Level Security (RLS)
All tables have RLS enabled:
- `rate_limits` - Service role access only
- `user_usage` - Users can view their own data
- `search_queries` - Users can view their own queries (NEW)

### Data Retention
- Anonymous search queries deleted after 30 days
- Rate limit records cleaned up automatically

## Implementation Details

### Middleware (`/middleware.ts`)
- Handles authentication checks
- Applies rate limiting
- Adds CORS headers
- Tracks anonymous users by IP

### Rate Limiter (`/lib/rate-limiter.ts`)
- Database-backed rate limiting
- Separate limits for anonymous vs authenticated
- Automatic cleanup of old records
- IP-based tracking for anonymous users

### AI Chat Protection (`/app/api/ai/chat/route.ts`)
- Authentication check (optional)
- Usage tracking for authenticated users
- Reduced context and token limits for anonymous users
- Rate limiting applied via middleware

## Monitoring and Alerts

### What to Monitor
1. Rate limit violations
2. Unusual usage patterns
3. API costs by endpoint
4. Anonymous vs authenticated usage ratio

### Recommended Alerts
- Set up alerts when API costs exceed thresholds
- Monitor for IP addresses hitting rate limits frequently
- Track failed authentication attempts

## Future Enhancements

### Phase 2 (Recommended)
1. **Browser Fingerprinting**
   - Combine multiple signals to track anonymous users
   - Make it harder to bypass rate limits

2. **Progressive Rate Limiting**
   - Start with generous limits
   - Reduce for suspicious behavior
   - Add CAPTCHA challenges

3. **Request Signing**
   - Add HMAC signatures to requests
   - Prevent replay attacks

### Phase 3 (Optional)
1. **API Key System**
   - Allow power users to get higher limits
   - Generate revenue from API access

2. **Geographic Restrictions**
   - Block requests from known VPN/proxy IPs
   - Implement country-based access controls

## Testing Security

### Test Anonymous Access
```bash
# Test search (should work up to 50 times/hour)
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "climate change"}'

# Test AI chat (should work up to 5 times/hour)
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"workId": "123", "fullText": "sample text", "messages": []}'
```

### Test Rate Limiting
```bash
# This script will hit rate limits
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/ai/chat \
    -H "Content-Type: application/json" \
    -d '{"workId": "123", "fullText": "test", "messages": []}'
  echo "Request $i completed"
done
```

## Security Checklist

- [x] Rate limiting on all expensive API endpoints
- [x] Different limits for anonymous vs authenticated users
- [x] CORS headers configured
- [x] Security headers implemented
- [x] Database RLS policies in place
- [x] API keys stored in environment variables
- [x] Error messages don't leak sensitive information
- [x] Input validation on all endpoints
- [ ] Browser fingerprinting (Phase 2)
- [ ] Request signing (Phase 2)
- [ ] Comprehensive audit logging (Phase 2)

## Support

For security concerns or questions:
- Open an issue on GitHub
- Email security@openpapergrid.com (set this up)
- Check logs for suspicious activity regularly