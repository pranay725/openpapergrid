import { NextRequest, NextResponse } from 'next/server';
import { LlamaParseReader } from "llamaindex";

// Types for NCBI API responses
interface NCBIIdConversionResponse {
  records?: Array<{
    pmid?: string;
    pmcid?: string;
    doi?: string;
  }>;
}

interface PMCFullTextResponse {
  // PMC XML structure would be parsed here
  fullText?: string;
  sections?: Record<string, string>;
}

interface FullTextResult {
  fullText: string;
  sections: Record<string, string>;
  source: 'pmc' | 'pdf' | 'firecrawl';
  metadata?: {
    pmcid?: string;
    pdfUrl?: string;
    webUrl?: string;
    extractionTime?: number;
  };
}

// Convert PMID to PMCID using NCBI ID Converter API
async function getPMCIDFromPMID(pmid: string): Promise<string | null> {
  try {
    const url = `https://www.ncbi.nlm.nih.gov/pmc/utils/idconv/v1.0/?ids=${pmid}&format=json`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('NCBI ID conversion failed:', response.status);
      return null;
    }
    
    const data: NCBIIdConversionResponse = await response.json();
    const record = data.records?.[0];
    
    if (record?.pmcid) {
      // Remove 'PMC' prefix if present
      return record.pmcid.replace('PMC', '');
    }
    
    return null;
  } catch (error) {
    console.error('Error converting PMID to PMCID:', error);
    return null;
  }
}

// Fetch full text from PMC
async function fetchPMCFullText(pmcid: string): Promise<PMCFullTextResponse | null> {
  try {
    // Fetch PMC article in XML format
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=${pmcid}&rettype=xml&retmode=text`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('PMC fetch failed:', response.status);
      return null;
    }
    
    const xmlText = await response.text();
    
    // Check if we actually got an article (not an error)
    if (!xmlText.includes('<article') && !xmlText.includes('<pmc-articleset>')) {
      console.error('PMC returned invalid response');
      return null;
    }
    
    // Extract text and sections from XML
    const fullText = extractTextFromPMCXML(xmlText);
    const sections = extractSectionsFromPMCXML(xmlText);
    
    // Only return if we got meaningful content
    if (fullText && fullText.length > 500) {
      return { fullText, sections };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching PMC full text:', error);
    return null;
  }
}

// Enhanced text extraction from PMC XML
function extractTextFromPMCXML(xml: string): string {
  // Extract article title
  const titleMatch = xml.match(/<article-title[^>]*>([\s\S]*?)<\/article-title>/);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, ' ').trim() : '';
  
  // Extract body content
  const bodyMatch = xml.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  const bodyText = bodyMatch ? bodyMatch[1] : xml;
  
  // Clean up the text
  let text = bodyText
    .replace(/<xref[^>]*>[\s\S]*?<\/xref>/g, '') // Remove references
    .replace(/<fig[^>]*>[\s\S]*?<\/fig>/g, '') // Remove figures
    .replace(/<table-wrap[^>]*>[\s\S]*?<\/table-wrap>/g, '') // Remove tables
    .replace(/<[^>]*>/g, ' ') // Remove remaining XML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  return title ? `${title}\n\n${text}` : text;
}

// Enhanced section extraction from PMC XML
function extractSectionsFromPMCXML(xml: string): Record<string, string> {
  const sections: Record<string, string> = {};
  
  // Extract title
  const titleMatch = xml.match(/<article-title[^>]*>([\s\S]*?)<\/article-title>/);
  if (titleMatch) {
    sections.title = titleMatch[1].replace(/<[^>]*>/g, ' ').trim();
  }
  
  // Extract abstract
  const abstractMatch = xml.match(/<abstract[^>]*>([\s\S]*?)<\/abstract>/);
  if (abstractMatch) {
    sections.abstract = abstractMatch[1].replace(/<[^>]*>/g, ' ').trim();
  }
  
  // Extract sections with more flexible matching
  const sectionRegex = /<sec[^>]*>[\s\S]*?<title[^>]*>([\s\S]*?)<\/title>([\s\S]*?)(?=<sec|<\/sec>|<\/body>)/g;
  let match;
  
  while ((match = sectionRegex.exec(xml)) !== null) {
    const sectionTitle = match[1].replace(/<[^>]*>/g, ' ').trim().toLowerCase();
    const sectionContent = match[2].replace(/<[^>]*>/g, ' ').trim();
    
    // Map common section titles
    if (sectionTitle.includes('introduction')) {
      sections.introduction = sectionContent;
    } else if (sectionTitle.includes('method')) {
      sections.methods = sectionContent;
    } else if (sectionTitle.includes('result')) {
      sections.results = sectionContent;
    } else if (sectionTitle.includes('discussion')) {
      sections.discussion = sectionContent;
    } else if (sectionTitle.includes('conclusion')) {
      sections.conclusion = sectionContent;
    }
  }
  
  return sections;
}

// Extract text from PDF using LlamaParse
async function extractTextFromPDF(pdfUrl: string): Promise<FullTextResult | null> {
  try {
    if (!process.env.LLAMA_CLOUD_API_KEY) {
      console.error('LlamaParse API key not configured');
      return null;
    }
    
    const startTime = Date.now();
    
    // Initialize LlamaParse
    const reader = new LlamaParseReader({ 
      apiKey: process.env.LLAMA_CLOUD_API_KEY,
      resultType: "markdown", // Get structured markdown output
      verbose: true
    });
    
    // Parse the PDF
    const documents = await reader.loadData(pdfUrl);
    
    if (!documents || documents.length === 0) {
      console.error('No content extracted from PDF');
      return null;
    }
    
    // Combine all document texts
    const fullText = documents.map((doc: any) => doc.text).join('\n\n');
    
    // Try to extract sections from the markdown
    const sections = extractSectionsFromMarkdown(fullText);
    
    return {
      fullText,
      sections,
      source: 'pdf',
      metadata: {
        pdfUrl,
        extractionTime: Date.now() - startTime
      }
    };
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return null;
  }
}

// Extract sections from markdown text
function extractSectionsFromMarkdown(markdown: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = markdown.split('\n');
  
  let currentSection = '';
  let currentContent: string[] = [];
  
  for (const line of lines) {
    // Check for headers (# Title, ## Section, etc.)
    const headerMatch = line.match(/^#+\s+(.+)$/);
    
    if (headerMatch) {
      // Save previous section if exists
      if (currentSection && currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      
      // Start new section
      const sectionTitle = headerMatch[1].toLowerCase();
      
      if (sectionTitle.includes('abstract')) {
        currentSection = 'abstract';
      } else if (sectionTitle.includes('introduction')) {
        currentSection = 'introduction';
      } else if (sectionTitle.includes('method')) {
        currentSection = 'methods';
      } else if (sectionTitle.includes('result')) {
        currentSection = 'results';
      } else if (sectionTitle.includes('discussion')) {
        currentSection = 'discussion';
      } else if (sectionTitle.includes('conclusion')) {
        currentSection = 'conclusion';
      } else {
        currentSection = sectionTitle.replace(/[^a-z0-9]/g, '_');
      }
      
      currentContent = [];
    } else if (line.trim()) {
      currentContent.push(line);
    }
  }
  
  // Save last section
  if (currentSection && currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n').trim();
  }
  
  // Extract title if present
  const titleMatch = markdown.match(/^#\s+([^\n]+)/);
  if (titleMatch) {
    sections.title = titleMatch[1].trim();
  }
  
  return sections;
}

// Fallback to Firecrawl for web scraping
async function extractTextWithFirecrawl(url: string): Promise<FullTextResult | null> {
  try {
    if (!process.env.FIRECRAWL_API_KEY) {
      console.error('Firecrawl API key not configured');
      return null;
    }
    
    const startTime = Date.now();
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 3000, // Wait for dynamic content
      }),
    });
    
    if (!response.ok) {
      console.error('Firecrawl request failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.success || !data.data) {
      console.error('Firecrawl returned no data');
      return null;
    }
    
    const markdown = data.data.markdown || '';
    const fullText = data.data.content || markdown;
    
    // Extract sections from the scraped content
    const sections = extractSectionsFromMarkdown(markdown);
    
    return {
      fullText,
      sections,
      source: 'firecrawl',
      metadata: {
        webUrl: url,
        extractionTime: Date.now() - startTime
      }
    };
  } catch (error) {
    console.error('Error with Firecrawl extraction:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { createSupabaseServerClient } = await import('@/lib/supabase-server');
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required for full text extraction' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { pmid, doi, pdfUrl, workId, landingPageUrl } = body;
    
    if (!workId) {
      return NextResponse.json(
        { error: 'Work ID is required' },
        { status: 400 }
      );
    }
    
    let fullTextResult: FullTextResult | null = null;
    const attempts: string[] = [];
    
    // Step 1: Try PMC first if we have PMID
    if (pmid) {
      console.log(`Attempting PMC extraction for PMID: ${pmid}`);
      attempts.push('PMC');
      
      const pmcid = await getPMCIDFromPMID(pmid);
      if (pmcid) {
        const pmcData = await fetchPMCFullText(pmcid);
        if (pmcData && pmcData.fullText) {
          fullTextResult = {
            fullText: pmcData.fullText,
            sections: pmcData.sections || {},
            source: 'pmc',
            metadata: { pmcid }
          };
        }
      }
    }
    
    // Step 2: Try PDF extraction with LlamaParse
    if (!fullTextResult && pdfUrl) {
      console.log(`Attempting PDF extraction for: ${pdfUrl}`);
      attempts.push('PDF');
      
      fullTextResult = await extractTextFromPDF(pdfUrl);
    }
    
    // Step 3: Fallback to Firecrawl for web scraping
    if (!fullTextResult && (landingPageUrl || doi)) {
      const webUrl = landingPageUrl || (doi ? `https://doi.org/${doi.replace('https://doi.org/', '')}` : null);
      
      if (webUrl) {
        console.log(`Attempting Firecrawl extraction for: ${webUrl}`);
        attempts.push('Firecrawl');
        
        fullTextResult = await extractTextWithFirecrawl(webUrl);
      }
    }
    
    // Check if we got any full text
    if (!fullTextResult) {
      return NextResponse.json(
        { 
          error: 'Could not retrieve full text from any source',
          attempts,
          sources: {
            pmid,
            pdfUrl,
            landingPageUrl,
            doi
          }
        },
        { status: 404 }
      );
    }
    
    // Return the full text data
    return NextResponse.json({
      workId,
      source: fullTextResult.source,
      fullText: fullTextResult.fullText,
      sections: fullTextResult.sections,
      metadata: fullTextResult.metadata,
      attempts,
      retrievedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Full text retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 