/**
 * Reconstructs the abstract text from an inverted index
 * @param invertedIndex - The inverted index object from OpenAlex
 * @returns The reconstructed abstract text
 */
export function reconstructAbstractFromInvertedIndex(
  invertedIndex: Record<string, number[]> | null | undefined
): string {
  if (!invertedIndex || Object.keys(invertedIndex).length === 0) {
    return '';
  }

  // Create an array to hold words at their positions
  const words: Array<{ word: string; positions: number[] }> = [];

  // Extract all words and their positions
  for (const [word, positions] of Object.entries(invertedIndex)) {
    if (Array.isArray(positions)) {
      words.push({ word, positions });
    }
  }

  // Find the maximum position to determine array size
  let maxPosition = 0;
  words.forEach(({ positions }) => {
    positions.forEach(pos => {
      if (pos > maxPosition) maxPosition = pos;
    });
  });

  // Create array with empty slots
  const reconstructed = new Array(maxPosition + 1).fill('');

  // Place each word at its positions
  words.forEach(({ word, positions }) => {
    positions.forEach(pos => {
      reconstructed[pos] = word;
    });
  });

  // Join the words with spaces and clean up
  return reconstructed
    .filter(word => word !== '')
    .join(' ')
    .trim();
}

/**
 * Prepares abstract data for extraction
 * @param work - The search result work object
 * @returns Object containing title and abstract for extraction
 */
export function prepareAbstractData(work: any): {
  title: string;
  abstract: string;
  hasAbstract: boolean;
} {
  const title = work.title || 'Untitled';
  const abstract = work.abstract 
    ? work.abstract 
    : reconstructAbstractFromInvertedIndex(work.abstract_inverted_index);
  
  return {
    title,
    abstract,
    hasAbstract: abstract.length > 0
  };
}

/**
 * Attempts to fetch abstract via web scraping if not available
 */
export async function fetchAbstractViaScraping(work: any): Promise<string | null> {
  try {
    const response = await fetch('/api/scrape-abstract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workId: work.id,
        doi: work.doi,
        url: work.primary_location?.landing_page_url || work.primary_location?.pdf_url
      })
    });
    
    if (!response.ok) {
      console.warn(`Failed to scrape abstract for ${work.id}:`, await response.text());
      return null;
    }
    
    const data = await response.json();
    return data.abstract || null;
  } catch (error) {
    console.error('Error scraping abstract:', error);
    return null;
  }
}

/**
 * Enhanced abstract preparation that attempts scraping if no abstract is available
 */
export async function prepareAbstractDataWithScraping(work: any): Promise<{
  title: string;
  abstract: string;
  hasAbstract: boolean;
  wasScraped?: boolean;
}> {
  const basicData = prepareAbstractData(work);
  
  // If we already have an abstract, return it
  if (basicData.hasAbstract) {
    return basicData;
  }
  
  // Try to scrape the abstract
  const scrapedAbstract = await fetchAbstractViaScraping(work);
  
  if (scrapedAbstract) {
    return {
      title: basicData.title,
      abstract: scrapedAbstract,
      hasAbstract: true,
      wasScraped: true
    };
  }
  
  // Still no abstract available
  return {
    ...basicData,
    wasScraped: false
  };
} 