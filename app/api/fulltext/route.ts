import { NextRequest, NextResponse } from 'next/server';

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
    
    // For MVP, we'll extract text content from XML
    // In production, use a proper XML parser
    const fullText = extractTextFromPMCXML(xmlText);
    
    return {
      fullText,
      sections: extractSectionsFromPMCXML(xmlText)
    };
  } catch (error) {
    console.error('Error fetching PMC full text:', error);
    return null;
  }
}

// Simple text extraction from PMC XML (MVP version)
function extractTextFromPMCXML(xml: string): string {
  // Remove XML tags and extract text content
  // This is a simplified version - in production use proper XML parsing
  let text = xml
    .replace(/<[^>]*>/g, ' ') // Remove all XML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  return text;
}

// Extract sections from PMC XML
function extractSectionsFromPMCXML(xml: string): Record<string, string> {
  const sections: Record<string, string> = {};
  
  // Extract abstract
  const abstractMatch = xml.match(/<abstract[^>]*>([\s\S]*?)<\/abstract>/);
  if (abstractMatch) {
    sections.abstract = abstractMatch[1].replace(/<[^>]*>/g, ' ').trim();
  }
  
  // Extract introduction
  const introMatch = xml.match(/<sec[^>]*>[\s\S]*?<title[^>]*>Introduction<\/title>([\s\S]*?)<\/sec>/);
  if (introMatch) {
    sections.introduction = introMatch[1].replace(/<[^>]*>/g, ' ').trim();
  }
  
  // Extract methods
  const methodsMatch = xml.match(/<sec[^>]*>[\s\S]*?<title[^>]*>Methods?<\/title>([\s\S]*?)<\/sec>/);
  if (methodsMatch) {
    sections.methods = methodsMatch[1].replace(/<[^>]*>/g, ' ').trim();
  }
  
  // Extract results
  const resultsMatch = xml.match(/<sec[^>]*>[\s\S]*?<title[^>]*>Results?<\/title>([\s\S]*?)<\/sec>/);
  if (resultsMatch) {
    sections.results = resultsMatch[1].replace(/<[^>]*>/g, ' ').trim();
  }
  
  // Extract discussion
  const discussionMatch = xml.match(/<sec[^>]*>[\s\S]*?<title[^>]*>Discussion<\/title>([\s\S]*?)<\/sec>/);
  if (discussionMatch) {
    sections.discussion = discussionMatch[1].replace(/<[^>]*>/g, ' ').trim();
  }
  
  return sections;
}

// Fallback: Extract text from PDF using LlamaParse
async function extractTextFromPDF(pdfUrl: string): Promise<string | null> {
  try {
    // For MVP, we'll return null and implement LlamaParse later
    // This would integrate with LlamaParse API
    console.log('PDF extraction not yet implemented for:', pdfUrl);
    return null;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pmid, doi, pdfUrl, workId } = body;
    
    if (!workId) {
      return NextResponse.json(
        { error: 'Work ID is required' },
        { status: 400 }
      );
    }
    
    let fullTextData = null;
    let source = null;
    
    // Try PMC first if we have PMID
    if (pmid) {
      const pmcid = await getPMCIDFromPMID(pmid);
      if (pmcid) {
        fullTextData = await fetchPMCFullText(pmcid);
        if (fullTextData) {
          source = 'pmc';
        }
      }
    }
    
    // Fallback to PDF if available and PMC failed
    if (!fullTextData && pdfUrl) {
      const pdfText = await extractTextFromPDF(pdfUrl);
      if (pdfText) {
        fullTextData = { fullText: pdfText };
        source = 'pdf';
      }
    }
    
    if (!fullTextData) {
      return NextResponse.json(
        { error: 'Could not retrieve full text from any source' },
        { status: 404 }
      );
    }
    
    // Return the full text data
    return NextResponse.json({
      workId,
      source,
      fullText: fullTextData.fullText,
      sections: fullTextData.sections || {},
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