# Rolling Window Extraction Implementation

## Overview

The extraction mechanism has been refactored to use a rolling window summarization chain approach, making it more efficient and cost-effective, especially for full-text papers.

## Key Benefits

1. **Cost Efficiency**: Process text in chunks, avoiding redundant processing
2. **Incremental Updates**: Build extraction results progressively
3. **Better Context Management**: Maintain relevant context across chunks
4. **Streaming Progress**: Real-time updates as extraction progresses

## Implementation Details

### 1. Chunking Strategy (`extractionChain.ts`)

```typescript
export const EXTRACTION_CONFIGS = {
  abstract: {
    chunkSize: 2000,  // Process abstracts in one chunk
    overlap: 0,
    maxChunks: 1
  },
  fulltext: {
    chunkSize: 3000,  // ~750 tokens per chunk
    overlap: 500,     // Maintain context between chunks
    maxChunks: 10     // Limit to ~30k characters for cost control
  }
}
```

### 2. Extraction Flow

#### Initial Extraction (First Chunk)
- Uses `generateInitialExtractionPrompt()`
- Extracts information for all fields from the first chunk
- Returns structured JSON with value, confidence, and citations

#### Incremental Updates (Subsequent Chunks)
- Uses `generateUpdatePrompt()` with existing results
- Only updates fields if new information adds value
- Maintains confidence scores, updating when better evidence found

### 3. Prompt Structure

#### Initial Prompt
```
You are a summarisation assistant specialized in extracting structured information from scientific papers.

Write a concise JSON summary of the text below, focusing on these fields:
- Field 1: Description
- Field 2: Description

------------
[CHUNK TEXT]
------------

Output Format (JSON Schema):
[SCHEMA]
```

#### Update Prompt
```
You are a summarisation assistant specialized in extracting structured information from scientific papers.

### Task
Improve the existing JSON summary **only if** the new context adds meaningful information; otherwise return the original unmodified.

### Current draft
[EXISTING JSON]

### Additional context
------------
[NEW CHUNK]
------------

Output Format (JSON Schema):
[SCHEMA]
```

### 4. Result Merging Strategy

The `mergeExtractionResults()` function handles:
- **New Values**: Add if no existing value
- **Confidence Updates**: Replace if new value has higher confidence
- **Multi-Select Fields**: Merge arrays, removing duplicates
- **Citations**: Accumulate from all chunks

### 5. API Changes

#### Request Format
```typescript
{
  workId: string,
  fields: CustomField[],        // Now processes all fields at once
  fullText: string,
  sections: Record<string, string>,
  provider: string,
  model: string,
  mode: 'abstract' | 'fulltext'
}
```

#### Response Format (Streaming)
```typescript
// Progress updates
{
  type: 'progress',
  chunk: number,
  totalChunks: number,
  currentResults: Record<string, AIResponse>
}

// Final results
{
  type: 'complete',
  results: Record<string, AIResponse>
}

// Error
{
  type: 'error',
  error: string
}
```

### 6. Frontend Integration

The `useFullTextExtraction` hook now:
- Calls `extractFields()` instead of individual field extraction
- Handles streaming updates for real-time progress
- Processes all fields in a single API call
- Supports both abstract and full-text modes

## Usage Example

```typescript
// In the extraction hook
const results = await extractFields(
  work,           // SearchResult
  aiFields,       // CustomField[]
  fullTextData,   // { fullText, sections }
  signal          // AbortSignal
);

// Results format
{
  "field_id_1": {
    "value": "extracted value",
    "confidence": 0.9,
    "citations": [...]
  },
  "field_id_2": {
    "value": ["option1", "option2"],
    "confidence": 0.85,
    "citations": [...]
  }
}
```

## Performance Considerations

1. **Chunk Size**: 3000 chars (~750 tokens) balances context and API limits
2. **Overlap**: 500 chars ensures continuity between chunks
3. **Max Chunks**: 10 chunks limit (~30k chars) controls costs
4. **Streaming**: Updates UI progressively, improving perceived performance

## Future Enhancements

1. **Dynamic Chunk Sizing**: Adjust based on document structure
2. **Smart Chunking**: Break at section boundaries when possible
3. **Field-Specific Processing**: Process only relevant sections for each field
4. **Caching**: Cache intermediate results for re-extraction
5. **Parallel Processing**: Process independent chunks simultaneously 