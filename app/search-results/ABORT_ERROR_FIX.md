# AbortController Error Fix

## Problem
Error: "signal is aborted without reason" when calling `abort()` on AbortController

## Root Cause
Modern browsers and Node.js environments expect a reason when aborting a signal. Calling `abort()` without parameters can throw an error.

## Solution
Provide a DOMException with reason when aborting:

```typescript
// Before (causes error)
controller.abort();

// After (fixed)
controller.abort(new DOMException('Reason for abort', 'AbortError'));
```

## Changes Made

1. **clearAllExtractionData**: 
   - Added try-catch around abort
   - Provides reason: "Extraction mode changed"

2. **cancelExtraction**:
   - Added try-catch around abort  
   - Provides reason: "User cancelled extraction"

## Error Handling
The try-catch blocks ensure that even if abort() fails in some environments, the cleanup continues without breaking the application.

## Testing
- Mode switching now cancels extractions cleanly
- Cancel button works without throwing errors
- No console errors when aborting operations 