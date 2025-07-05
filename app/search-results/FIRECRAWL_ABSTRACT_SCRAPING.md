# Firecrawl Abstract Scraping Integration

## Overview

The application now includes Firecrawl integration to automatically fetch abstracts for papers that don't have them in the OpenAlex database. This ensures that abstract-based extraction can work for a wider range of papers.

## Features

### 1. Automatic Fallback
When a paper lacks an abstract in OpenAlex data:
- First checks for regular abstract text
- Then checks for inverted index format
- Finally attempts to scrape from the paper's landing page

### 2. Smart Abstract Extraction
The scraping system uses multiple strategies to find abstracts:
- Looks for explicit "Abstract" sections
- Checks for "Summary" sections
- Examines meta description tags
- Falls back to first substantial paragraph

### 3. Performance Optimization
- Uses Firecrawl's `maxAge` parameter for caching (24 hours)
- Returns cached results instantly when available
- 500% faster for repeated requests

## Implementation Details

### API Endpoint: `/api/scrape-abstract`

```typescript
POST /api/scrape-abstract
{
  workId: string,      // Required: Work identifier
  doi?: string,        // Optional: DOI for constructing URL
  url?: string         // Optional: Direct URL to scrape
}
```

### Response Format

Success:
```json
{
  "success": true,
  "abstract": "The extracted abstract text...",
  "title": "Paper Title",
  "sourceUrl": "https://doi.org/...",
  "cached": false
}
```

Error (no abstract found):
```json
{
  "error": "No abstract found in scraped content",
  "scraped": true,
  "sourceUrl": "https://doi.org/..."
}
```

### Abstract Extraction Patterns

The system uses regex patterns to identify abstracts:

1. **Explicit Abstract Section**
   ```regex
   /Abstract[:\s]*\n+([\s\S]*?)(?=\n\n[A-Z]|\n\s*Keywords|\n\s*Introduction|\n\s*Background|$)/i
   ```

2. **Summary Section**
   ```regex
   /Summary[:\s]*\n+([\s\S]*?)(?=\n\n[A-Z]|\n\s*Keywords|\n\s*Introduction|$)/i
   ```

3. **Meta Description**
   ```regex
   /(?:description|abstract)[:\s]*["']?([\s\S]{100,800})["']?/i
   ```

4. **First Paragraph Fallback**
   - Extracts first paragraph with 100-1000 characters
   - Must contain complete sentences

## Usage in Extraction Workflow

### Enhanced Abstract Preparation

```typescript
// Basic preparation (no scraping)
const abstractData = prepareAbstractData(work);

// Enhanced preparation with scraping fallback
const abstractData = await prepareAbstractDataWithScraping(work);
```

### Integration with Extraction Hook

The `useFullTextExtraction` hook automatically uses scraping when:
- Mode is set to 'abstract'
- No abstract is available in OpenAlex data
- DOI or landing page URL is available

```typescript
if (mode === 'abstract') {
  const abstractData = await prepareAbstractDataWithScraping(work);
  
  if (!abstractData.hasAbstract) {
    throw new Error('No abstract available (tried scraping)');
  }
  
  // Continue with extraction...
}
```

## Configuration

### Environment Variable
```env
FIRECRAWL_API_KEY=fc-your-api-key
```

### Firecrawl Settings
- **Format**: Markdown (easier to parse)
- **Cache Duration**: 24 hours (86400000 ms)
- **Main Content Only**: Yes (reduces noise)
- **Timeout**: 30 seconds
- **Wait Time**: 2 seconds (for dynamic content)

## Benefits

1. **Increased Coverage**: Can extract from papers without OpenAlex abstracts
2. **Cost Effective**: Caching reduces API calls
3. **Fast**: Cached results return in milliseconds
4. **Reliable**: Multiple extraction strategies ensure high success rate

## Limitations

1. **Rate Limits**: Subject to Firecrawl API limits
2. **Paywall Content**: Cannot access paywalled abstracts
3. **Dynamic Content**: Some sites may require longer wait times
4. **Abstract Quality**: Scraped abstracts may vary in formatting

## Future Enhancements

1. **Batch Scraping**: Process multiple papers simultaneously
2. **Source Priority**: Try multiple URLs (DOI, PubMed, publisher)
3. **Quality Scoring**: Rate abstract quality and completeness
4. **Persistent Cache**: Store scraped abstracts in database
5. **Fallback Sources**: Try alternative databases (PubMed, CrossRef) 