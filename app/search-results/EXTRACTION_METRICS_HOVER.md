# Extraction Metrics Hover Card

## Overview

The Status column now provides detailed extraction metrics when hovering over completed extractions. This "nerd out" feature shows comprehensive information about the extraction process including timing, token usage, costs, and data sources.

## Features

### 1. Data Source Information
- **Abstract Source Type**: OpenAlex, OpenAlex Inverted Index, Web Scraped, or Full Text
- **Content Length**: Character count for abstracts and full text
- **Scraping Details**: URL and hostname for scraped content

### 2. Performance Metrics
- **Total Duration**: End-to-end extraction time
- **Scraping Time**: Time spent fetching abstracts via Firecrawl (if applicable)
- **AI Processing Time**: Pure extraction time excluding data fetching

### 3. AI Processing Details
- **Model Used**: Shows the specific model (abbreviated for readability)
- **Provider**: OpenRouter, OpenAI, etc.
- **Chunks Processed**: For full-text mode, shows progress through document

### 4. Token Usage
- **Input Tokens**: Prompt tokens sent to the model
- **Output Tokens**: Completion tokens received
- **Total Tokens**: Combined token count

### 5. Cost Estimation
- **Input Cost**: Based on model's input pricing
- **Output Cost**: Based on model's output pricing
- **Total Cost**: Combined cost in USD
- Only shown for paid models (free models show $0.0000)

### 6. Field Confidence Summary
- Visual confidence bars for each extracted field
- Percentage display of confidence scores
- Quick overview of extraction quality

## Implementation Details

### ExtractionMetrics Type
```typescript
interface ExtractionMetrics {
  // Timing
  startTime: number;
  endTime: number;
  duration: number;
  
  // Source information
  abstractSource: 'openalex' | 'openalex_inverted' | 'scraped' | 'fulltext';
  abstractLength?: number;
  fullTextLength?: number;
  
  // Scraping details
  scrapingDuration?: number;
  scrapedFrom?: string;
  
  // AI Processing
  model: string;
  provider: string;
  chunksProcessed?: number;
  totalChunks?: number;
  
  // Token usage
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  
  // Cost estimation
  estimatedCost?: number;
  costBreakdown?: {
    input: number;
    output: number;
  };
  
  // Field metrics
  fieldMetrics?: Record<string, {
    tokens?: number;
    duration?: number;
    confidence: number;
  }>;
}
```

### Model Pricing
Current pricing per 1M tokens:
- **Free Models**: $0.00
- **GPT-3.5 Turbo**: $0.50 input / $1.50 output
- **GPT-4**: $5.00 input / $15.00 output
- **Gemini Flash**: $0.075 input / $0.30 output

### Visual Design
- **Card Style**: White background with shadow and border
- **Sections**: Separated by light borders for clarity
- **Icons**: Lucide icons for each section (Database, Clock, CPU, etc.)
- **Typography**: Monospace for technical values, consistent sizing
- **Colors**: 
  - Green for high confidence/low cost
  - Yellow for medium confidence
  - Orange for low confidence
  - Blue for links and progress bars

## Usage

1. Complete an extraction (abstract or full-text)
2. Hover over the status indicator (colored dot)
3. An info icon appears on completed extractions
4. The detailed metrics card appears on hover

## Benefits

1. **Transparency**: Users can see exactly what happened during extraction
2. **Cost Awareness**: Clear visibility into API costs
3. **Quality Assessment**: Confidence scores help evaluate results
4. **Performance Monitoring**: Identify slow extractions or bottlenecks
5. **Debugging**: Detailed information helps troubleshoot issues

## Future Enhancements

1. **Historical Metrics**: Track costs over time
2. **Batch Analytics**: Aggregate metrics for multiple extractions
3. **Export Functionality**: Download metrics as CSV/JSON
4. **Custom Pricing**: Allow users to configure their own API pricing
5. **Performance Recommendations**: Suggest optimizations based on metrics 