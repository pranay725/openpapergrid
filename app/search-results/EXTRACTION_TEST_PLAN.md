# Extraction Flow Test Plan

## Test Scenarios

### 1. Abstract Mode Testing

#### Scenario A: Paper with OpenAlex Abstract
- **Input**: Paper with `abstract` field populated
- **Expected**: 
  - Extraction completes successfully
  - Metrics show `abstractSource: 'openalex'`
  - All fields extracted with citations

#### Scenario B: Paper with Inverted Index Only
- **Input**: Paper with `abstract_inverted_index` but no `abstract`
- **Expected**:
  - Abstract reconstructed from inverted index
  - Metrics show `abstractSource: 'openalex_inverted'`
  - Extraction proceeds normally

#### Scenario C: Paper Requiring Scraping
- **Input**: Paper with no abstract, but valid DOI/URL
- **Expected**:
  - Firecrawl API called to scrape abstract
  - Metrics show `abstractSource: 'scraped'`
  - `scrapingDuration` tracked
  - Extraction completes if abstract found

#### Scenario D: Failed Abstract Extraction
- **Input**: Paper with no abstract and failed scraping
- **Expected**:
  - Error state with message "No abstract available"
  - Retry button shows with count (3 remaining)
  - Each retry attempt tracked

### 2. Full Text Mode Testing

#### Scenario E: PMC Available
- **Input**: Paper with PMID
- **Expected**:
  - PMID → PMCID conversion
  - PMC XML fetched and parsed
  - Metrics show `fullTextSource: 'pmc'`
  - Sections extracted (methods, results, etc.)

#### Scenario F: PDF Extraction
- **Input**: Paper with PDF URL, no PMID
- **Expected**:
  - LlamaParse processes PDF
  - Markdown sections extracted
  - Metrics show `fullTextSource: 'pdf'`
  - Full text available in viewer

#### Scenario G: Web Scraping Fallback
- **Input**: Paper with landing page URL only
- **Expected**:
  - Firecrawl scrapes full text
  - Metrics show `fullTextSource: 'firecrawl'`
  - Best effort section extraction

#### Scenario H: All Sources Fail
- **Input**: Paper with invalid/inaccessible URLs
- **Expected**:
  - Error state with detailed message
  - Shows attempted sources
  - Retry button available

### 3. Retry & Refresh Testing

#### Scenario I: Retry Failed Extraction
- **Steps**:
  1. Trigger extraction failure (e.g., network error)
  2. Click "Retry (3 left)" button
  3. Verify retry counter decrements
  4. After 3 failures, button disabled
- **Expected**: Graceful degradation with clear feedback

#### Scenario J: Refresh Successful Extraction
- **Steps**:
  1. Complete successful extraction
  2. Click "Re-extract" button
  3. Verify cache cleared
  4. New extraction with updated data
- **Expected**: Fresh extraction without using cache

#### Scenario K: Single Field Refresh
- **Steps**:
  1. Complete extraction
  2. Click "Refresh" on individual field
  3. Only that field re-extracted
- **Expected**: Efficient single field update

### 4. Edge Cases

#### Scenario L: Concurrent Extractions
- **Input**: Start extraction on multiple papers simultaneously
- **Expected**: 
  - Progress tracked independently
  - No race conditions
  - Proper abort handling

#### Scenario M: Mode Switching
- **Input**: Switch between Abstract/Full Text during extraction
- **Expected**:
  - Current extractions cancelled
  - Mode change reflected in new extractions

#### Scenario N: Network Interruption
- **Input**: Lose connection during extraction
- **Expected**:
  - Error state with retry option
  - Partial results not lost
  - Clear error messaging

#### Scenario O: Rate Limiting
- **Input**: Hit API rate limits
- **Expected**:
  - Specific rate limit error
  - Retry with backoff suggested
  - Other papers can still be processed

## Verification Checklist

### UI Elements
- [ ] Retry button shows remaining attempts
- [ ] Refresh button appears after completion
- [ ] Individual field refresh buttons work
- [ ] Progress indicators accurate
- [ ] Error messages informative

### Data Integrity
- [ ] Extracted values match source text
- [ ] Citations point to correct locations
- [ ] Confidence scores reasonable
- [ ] No data loss on refresh

### Performance
- [ ] Abstract extraction < 5 seconds
- [ ] Full text extraction < 30 seconds
- [ ] Single field refresh < 3 seconds
- [ ] Streaming updates smooth

### Error Handling
- [ ] Network errors recoverable
- [ ] API errors show details
- [ ] Max retries enforced
- [ ] Graceful degradation

## Manual Test Steps

1. **Search for "CRISPR"**
2. **Switch to Abstract mode**
3. **Click Extract** - verify all papers process
4. **Find paper with error** - click Retry
5. **Switch to Full Text mode**
6. **Click Re-extract on completed paper**
7. **Click Refresh on single field**
8. **Open Full Text Viewer** - verify source shown
9. **Check extraction metrics hover card**
10. **Verify confidence scoring works** 