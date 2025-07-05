# Testing the Extraction Metrics Hover Card

## Steps to See the Hover Card

1. **Start the Development Server**
   ```bash
   npm run dev
   ```

2. **Navigate to Search Results**
   - Go to http://localhost:3002/search-results?query=cancer (or any search query)

3. **Run an Extraction**
   - Click the "Extract" button in the extraction controls bar
   - Wait for the extraction to complete (status will change from spinning to a solid dot)

4. **Hover Over the Status**
   - Once extraction is complete, hover over the status indicator (colored dot)
   - You should see a small info icon appear
   - The detailed metrics card will appear showing:
     - Data source (OpenAlex, scraped, etc.)
     - Performance metrics (duration, timing)
     - AI processing details (model, provider)
     - Token usage
     - Cost estimation
     - Field confidence scores

## What Was Fixed

1. **Status Generation**: The status was always showing as "pending". Now it properly shows:
   - "Abstract Extracted" for abstract mode extractions
   - "Full Text Extracted" for full-text mode extractions

2. **Metrics Collection**: The extraction process now properly collects:
   - Start and end times
   - Abstract source detection
   - Token usage from the AI SDK
   - Field-level confidence scores

3. **Hover Card Display**: The StatusIndicator now:
   - Shows an info icon on completed extractions
   - Displays the detailed metrics card on hover
   - Positions the card properly to avoid overflow

## Troubleshooting

If you don't see the hover card:

1. **Check the Console**: Look for any errors in the browser console
2. **Verify Extraction Completed**: The status should show a solid green dot
3. **Check Metrics Storage**: In the React DevTools, check if `extractionMetrics` has data
4. **Ensure Hover Events Work**: The info icon should appear when hovering

## Current Limitations

1. **Token Usage**: May not be available for all models/providers
2. **Cost Calculation**: Only implemented for known models
3. **Scraping Metrics**: Only available when abstract is scraped via Firecrawl 