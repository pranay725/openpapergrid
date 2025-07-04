# Full Text Extraction and AI Field Population

This feature enables automatic extraction of full text from scientific papers and uses AI to populate custom fields based on the paper content.

## Overview

When viewing search results, users can:
1. Select an AI provider and model
2. Click "Extract with AI" to process visible papers
3. Watch real-time progress as fields are extracted
4. View confidence scores and citations for each extracted value

## Architecture

### Full Text Retrieval Pipeline

```
OpenAlex Result → Check PMID → NCBI PMC API → Full Text
                              ↓ (if no PMC)
                        OpenAlex PDF URL → LlamaParse
```

### Components

1. **API Routes**
   - `/api/fulltext` - Fetches full text from PMC or PDF sources
   - `/api/ai/extract` - Processes text with selected LLM provider

2. **Hooks**
   - `useFullTextExtraction` - Manages extraction state and orchestration
   - `useAIResponses` - Handles AI response storage and updates

3. **UI Components**
   - `AIProviderSelector` - Dropdown for provider/model selection
   - `ExtractButton` - Triggers extraction for visible results
   - `StatusIndicator` - Shows real-time extraction progress

## Configuration

### Environment Variables

Add these to your `.env.local`:

```bash
# AI Providers
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# PDF Extraction (optional)
LLAMAPARSE_API_KEY=your_llamaparse_api_key
```

### Supported Providers

- **OpenAI**: GPT-4 Turbo, GPT-4, GPT-3.5 Turbo
- **Anthropic**: Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku

## Usage

1. **Run a search** to display results
2. **Select AI provider** from the dropdown (defaults to OpenAI GPT-3.5)
3. **Click "Extract with AI"** to start processing
4. **Monitor progress** via the status indicators
5. **Review extracted values** with confidence scores and citations

## Features

### Smart Text Extraction
- Prioritizes free sources (PMC) before paid services
- Extracts structured sections (Abstract, Methods, Results, etc.)
- Falls back to PDF extraction when PMC unavailable

### AI Field Extraction
- Context-aware prompts based on field type
- Confidence scoring for each extracted value
- Citation tracking to source locations
- Streaming responses for better UX

### Progress Tracking
- Real-time status updates per paper
- Progress percentage for extraction
- Current field being processed
- Cancellable operations

## Caching

- Full text is cached in memory during session
- Prevents redundant API calls for same papers
- Future: Supabase storage for persistent caching

## Limitations

- MVP uses simple XML parsing for PMC content
- PDF extraction via LlamaParse not yet implemented
- Rate limits apply to NCBI and AI provider APIs
- Processing time depends on paper length and field count

## Future Enhancements

1. **Batch Processing**: Queue-based system for large sets
2. **Persistent Storage**: Save extractions to Supabase
3. **Custom Prompts**: User-defined extraction instructions
4. **Export Options**: Download extracted data as CSV/JSON
5. **Incremental Updates**: Process only new/changed fields 