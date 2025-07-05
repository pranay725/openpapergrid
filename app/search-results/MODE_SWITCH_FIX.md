# Extraction Mode Switch Fix

## Problem
When switching between Abstract and Full Text modes, the "Re-extract" button wasn't working because the extraction hook was still using the old mode value.

## Root Cause
The `mode` parameter was captured in the closure of the callback functions (`processWork`, `extractFields`, etc.) when the hook was initialized. When the mode changed in the UI, these callbacks still used the old mode value.

## Solution

### 1. Use Ref for Current Mode
Added a `modeRef` to always have access to the current mode value:
```typescript
const modeRef = useRef(mode);
useEffect(() => {
  modeRef.current = mode;
}, [mode]);
```

### 2. Update All Mode References
Changed all references from `mode` to `modeRef.current` in:
- `extractFields` - API call body
- `processWork` - Mode check for abstract vs fulltext
- `extractSingleField` - Mode check for data fetching
- Metrics calculation

### 3. Clear Data on Mode Change
Added `clearAllExtractionData` function to reset all extraction state when switching modes:
```typescript
const clearAllExtractionData = useCallback(() => {
  // Cancel all ongoing extractions
  Object.keys(abortControllers.current).forEach(workId => {
    abortControllers.current[workId]?.abort();
  });
  abortControllers.current = {};
  
  // Clear all states
  setExtractionStates({});
  setFullTextCache({});
  setExtractionPrompts({});
  setExtractionMetrics({});
  setRetryCount({});
}, []);
```

### 4. Auto-Clear on Mode Switch
Added effect in main component to clear data when mode changes:
```typescript
useEffect(() => {
  if (prevExtractionModeRef.current !== extractionMode) {
    prevExtractionModeRef.current = extractionMode;
    clearAllExtractionData();
    // Also clear AI responses
  }
}, [extractionMode, ...]);
```

## Testing
1. Extract in Abstract mode
2. Switch to Full Text mode
3. Click "Re-extract" - should now fetch full text
4. Switch back to Abstract mode
5. Click "Re-extract" - should now use abstract only

## Benefits
- Mode switches are now properly handled
- Previous extraction data is cleared to avoid confusion
- Re-extract button works correctly after mode changes
- No stale data from previous mode 