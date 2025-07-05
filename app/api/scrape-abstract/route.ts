import { NextRequest, NextResponse } from 'next/server';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v1/scrape';

interface ScrapeRequest {
  doi?: string;
  url?: string;
  workId: string;
}

interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
    content?: string;
    metadata?: {
      title?: string;
      description?: string;
      sourceURL?: string;
    };
  };
  error?: string;
}

/**
 * Extract abstract from scraped content
 */
function extractAbstractFromContent(content: string): string | null {
  if (!content) return null;
  
  // Common abstract patterns
  const abstractPatterns = [
    // Look for explicit "Abstract" section
    /Abstract[:\s]*\n+([\s\S]*?)(?=\n\n[A-Z]|\n\s*Keywords|\n\s*Introduction|\n\s*Background|$)/i,
    // Look for summary section
    /Summary[:\s]*\n+([\s\S]*?)(?=\n\n[A-Z]|\n\s*Keywords|\n\s*Introduction|$)/i,
    // Look for description meta tag content
    /(?:description|abstract)[:\s]*["']?([\s\S]{100,800})["']?/i,
    // First substantial paragraph after title
    /^(?:.*?\n\n)([\s\S]{100,800})(?=\n\n|\n\s*[A-Z])/
  ];
  
  for (const pattern of abstractPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const abstract = match[1].trim()
        .replace(/\s+/g, ' ')  // Normalize whitespace
        .replace(/^["']|["']$/g, ''); // Remove quotes
      
      // Validate it looks like an abstract (100-1000 chars, complete sentences)
      if (abstract.length >= 100 && abstract.length <= 1000 && abstract.includes('.')) {
        return abstract;
      }
    }
  }
  
  // If no pattern matches, try to extract first meaningful paragraph
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 100);
  if (paragraphs.length > 0) {
    const firstPara = paragraphs[0].trim();
    if (firstPara.length >= 100 && firstPara.length <= 1000) {
      return firstPara;
    }
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body: ScrapeRequest = await request.json();
    const { doi, url, workId } = body;
    
    if (!workId || (!doi && !url)) {
      return NextResponse.json(
        { error: 'Missing required fields: workId and either doi or url' },
        { status: 400 }
      );
    }
    
    if (!FIRECRAWL_API_KEY) {
      return NextResponse.json(
        { error: 'Firecrawl API key not configured' },
        { status: 500 }
      );
    }
    
    // Construct URL to scrape
    let scrapeUrl = url;
    if (!scrapeUrl && doi) {
      // Try DOI.org first, then fallback to common publishers
      scrapeUrl = `https://doi.org/${doi}`;
    }
    
    if (!scrapeUrl) {
      return NextResponse.json(
        { error: 'Unable to construct URL for scraping' },
        { status: 400 }
      );
    }
    
    // Call Firecrawl API with caching enabled
    const firecrawlResponse = await fetch(FIRECRAWL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        url: scrapeUrl,
        formats: ['markdown'],
        maxAge: 86400000, // Cache for 1 day (24 hours)
        onlyMainContent: true,
        timeout: 30000,
        waitFor: 2000 // Wait 2s for dynamic content
      })
    });
    
    if (!firecrawlResponse.ok) {
      const errorText = await firecrawlResponse.text();
      console.error('Firecrawl API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to scrape content', details: errorText },
        { status: firecrawlResponse.status }
      );
    }
    
    const firecrawlData: FirecrawlResponse = await firecrawlResponse.json();
    
    if (!firecrawlData.success || !firecrawlData.data) {
      return NextResponse.json(
        { error: 'Scraping failed', details: firecrawlData.error },
        { status: 400 }
      );
    }
    
    // Extract abstract from scraped content
    const content = firecrawlData.data.markdown || firecrawlData.data.content || '';
    const extractedAbstract = extractAbstractFromContent(content);
    
    // Also check metadata description
    const metaDescription = firecrawlData.data.metadata?.description;
    
    const abstract = extractedAbstract || metaDescription || null;
    
    if (!abstract) {
      return NextResponse.json(
        { 
          error: 'No abstract found in scraped content',
          scraped: true,
          sourceUrl: firecrawlData.data.metadata?.sourceURL || scrapeUrl
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      abstract,
      title: firecrawlData.data.metadata?.title,
      sourceUrl: firecrawlData.data.metadata?.sourceURL || scrapeUrl,
      cached: false // Could be enhanced to detect if Firecrawl returned cached data
    });
    
  } catch (error) {
    console.error('Scrape abstract error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 