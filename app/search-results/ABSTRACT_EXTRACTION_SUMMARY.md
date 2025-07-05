# Abstract Extraction Implementation Summary

## Overview
The abstract extraction mode has been implemented to reconstruct abstracts from OpenAlex's inverted index format and use them for AI field extraction, providing a faster alternative to full-text extraction.

## Key Components

### 1. Abstract Reconstruction Utility
**File**: `app/search-results/utils/abstractHelpers.ts`

#### `reconstructAbstractFromInvertedIndex()`
- Converts OpenAlex's inverted index format back to readable text
- Handles the word-position mapping structure
- Returns empty string if no index available

#### `prepareAbstractData()`
- Prepares data for extraction with title and abstract
- Falls back to inverted index reconstruction if plain abstract not available
- Returns structured data with `hasAbstract` flag

### 2. Type Updates
**File**: `app/search-results/types/index.ts`
- Added `abstract_inverted_index?: Record<string, number[]>` to SearchResult interface

### 3. Extraction Hook Updates
**File**: `app/search-results/hooks/useFullTextExtraction.ts`

#### Abstract Mode Processing:
```typescript
if (mode === 'abstract') {
  const abstractData = prepareAbstractData(work);
  
  fullTextData = {
    fullText: `Title: ${abstractData.title}\n\nAbstract: ${abstractData.abstract}`,
    sections: {
      title: abstractData.title,
      abstract: abstractData.abstract
    }
  };
}
```

#### Prompt Generation:
- Updated to include title in extraction context
- Mode-aware: only includes methods/results sections in fulltext mode
- Consistent format for both abstract and fulltext modes

### 4. API Route Updates
**File**: `app/api/ai/extract/route.ts`
- Enhanced prompt generation to include title when available
- Maintains compatibility with both extraction modes

## Data Flow

### Abstract Mode:
1. User selects "Abstract" mode in UI
2. Search results include `abstract_inverted_index` from OpenAlex
3. When extraction starts:
   - `prepareAbstractData()` reconstructs abstract from inverted index
   - Title and abstract are formatted as extraction context
   - AI processes only title + abstract (faster)

### Inverted Index Format:
```json
{
  "abstract_inverted_index": {
    "Despite": [0],
    "growing": [1],
    "interest": [2],
    "in": [3, 57, 73, 110, 122],
    ...
  }
}
```

### Reconstructed Output:
```
"Despite growing interest in..."
```

## Benefits

1. **Performance**: Abstract-only extraction is much faster than full-text
2. **Availability**: Works for all papers (abstracts are always available)
3. **Cost-Effective**: Less AI processing required
4. **Accuracy**: Sufficient for many screening tasks

## Future Enhancements

1. **Caching**: Cache reconstructed abstracts to avoid repeated processing
2. **Validation**: Add checks for malformed inverted indices
3. **Optimization**: Stream reconstruction for very large abstracts
4. **Fallbacks**: Handle edge cases where neither abstract nor inverted index exists

## Usage

The system automatically handles abstract reconstruction when:
- Extract mode is set to "Abstract"
- Paper has `abstract_inverted_index` but no plain `abstract`
- User initiates extraction

No additional configuration needed - the system seamlessly switches between plain abstracts and reconstructed ones. 