import { NextResponse } from 'next/server';

// Simple in-memory rate limit tracking
const requestTimestamps: number[] = [];
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(): boolean {
  const now = Date.now();
  // Remove old timestamps
  const validTimestamps = requestTimestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
  requestTimestamps.length = 0;
  requestTimestamps.push(...validTimestamps);
  
  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  requestTimestamps.push(now);
  return true;
}

async function fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      
      if (response.status === 429) {
        // Rate limited by OpenAlex
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
          continue;
        }
      }
      
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  
  throw new Error('Max retries reached');
}

export async function GET(request: Request) {
  // Check our own rate limit first
  if (!checkRateLimit()) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment before searching again.' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const year = searchParams.get('year');
  const openAccess = searchParams.get('openAccess');
  const topics = searchParams.get('topics');
  const institutions = searchParams.get('institutions');
  const types = searchParams.get('types');
  const countries = searchParams.get('countries');
  const authors = searchParams.get('authors');
  const textAvailability = searchParams.get('textAvailability');
  const journals = searchParams.get('journals');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  // Build filter using title_and_abstract.search
  let filter = `title_and_abstract.search:${query}`;
  
  if (year) {
    filter += `,publication_year:${year.split('|').join('|')}`;
  }
  if (openAccess === 'true') {
    filter += ',is_oa:true';
  }
  if (topics) {
    filter += `,primary_topic.id:${topics.split('|').join('|')}`;
  }
  if (institutions) {
    filter += `,authorships.institutions.lineage:${institutions.split('|').join('|')}`;
  }
  if (types) {
    // Extract just the type key from URLs if needed
    const typeValues = types.split('|').map(t => {
      if (t.startsWith('https://openalex.org/types/')) {
        return t.replace('https://openalex.org/types/', '');
      }
      return t;
    });
    filter += `,type:${typeValues.join('|')}`;
  }
  if (countries) {
    // Extract country codes from URLs if needed
    const countryValues = countries.split('|').map(c => {
      if (c.startsWith('https://openalex.org/countries/')) {
        return c.replace('https://openalex.org/countries/', '').toLowerCase();
      }
      return c.toLowerCase();
    });
    filter += `,authorships.countries:${countryValues.join('|')}`;
  }
  if (authors) {
    filter += `,authorships.author.id:${authors.split('|').join('|')}`;
  }
  if (journals) {
    filter += `,primary_location.source.id:${journals.split('|').join('|')}`;
  }
  if (textAvailability) {
    const textFilter = textAvailability.split('|')[0]; // Now it's single selection
    if (textFilter === 'is_oa') {
      filter += ',is_oa:true';
    } else if (textFilter === 'has_fulltext') {
      filter += ',open_access.any_repository_has_fulltext:true';
    } else if (textFilter === 'abstract_only') {
      filter += ',is_oa:false,open_access.any_repository_has_fulltext:false';
    }
  }

  const worksParams = new URLSearchParams({ filter, per_page: '25' });
  const worksUrl = `https://api.openalex.org/works?${worksParams.toString()}`;

  // Create multiple group_by queries for different facets
  const groupByYear = new URLSearchParams({
    filter,
    group_by: 'publication_year',
    per_page: '200'
  });
  const groupByType = new URLSearchParams({
    filter,
    group_by: 'type',
    per_page: '200'
  });
  const groupByOA = new URLSearchParams({
    filter,
    group_by: 'is_oa',
    per_page: '200'
  });
  const groupByTopic = new URLSearchParams({
    filter,
    group_by: 'primary_topic.id',
    per_page: '200'
  });
  const groupByInstitution = new URLSearchParams({
    filter,
    group_by: 'authorships.institutions.lineage',
    per_page: '200'
  });
  const groupByCountry = new URLSearchParams({
    filter,
    group_by: 'authorships.countries',
    per_page: '200'
  });
  const groupByAuthor = new URLSearchParams({
    filter,
    group_by: 'authorships.author.id',
    per_page: '200'
  });
  const groupByJournal = new URLSearchParams({
    filter,
    group_by: 'primary_location.source.id',
    per_page: '200'
  });

  try {
    const [worksResponse, yearResponse, typeResponse, oaResponse, topicResponse, institutionResponse, countryResponse, authorResponse, journalResponse] = await Promise.all([
      fetchWithRetry(worksUrl),
      fetchWithRetry(`https://api.openalex.org/works?${groupByYear.toString()}`),
      fetchWithRetry(`https://api.openalex.org/works?${groupByType.toString()}`),
      fetchWithRetry(`https://api.openalex.org/works?${groupByOA.toString()}`),
      fetchWithRetry(`https://api.openalex.org/works?${groupByTopic.toString()}`),
      fetchWithRetry(`https://api.openalex.org/works?${groupByInstitution.toString()}`),
      fetchWithRetry(`https://api.openalex.org/works?${groupByCountry.toString()}`),
      fetchWithRetry(`https://api.openalex.org/works?${groupByAuthor.toString()}`),
      fetchWithRetry(`https://api.openalex.org/works?${groupByJournal.toString()}`)
    ]);

    if (!worksResponse.ok) {
      throw new Error(`HTTP error! status: ${worksResponse.status}`);
    }
    if (!yearResponse.ok) {
      throw new Error(`HTTP error! status: ${yearResponse.status}`);
    }
    if (!typeResponse.ok) {
      throw new Error(`HTTP error! status: ${typeResponse.status}`);
    }
    if (!oaResponse.ok) {
      throw new Error(`HTTP error! status: ${oaResponse.status}`);
    }
    if (!topicResponse.ok) {
      throw new Error(`HTTP error! status: ${topicResponse.status}`);
    }
    if (!institutionResponse.ok) {
      throw new Error(`HTTP error! status: ${institutionResponse.status}`);
    }
    if (!countryResponse.ok) {
      throw new Error(`HTTP error! status: ${countryResponse.status}`);
    }
    if (!authorResponse.ok) {
      throw new Error(`HTTP error! status: ${authorResponse.status}`);
    }
    if (!journalResponse.ok) {
      throw new Error(`HTTP error! status: ${journalResponse.status}`);
    }

    const worksData = await worksResponse.json();
    const yearData = await yearResponse.json();
    const typeData = await typeResponse.json();
    const oaData = await oaResponse.json();
    const topicData = await topicResponse.json();
    const institutionData = await institutionResponse.json();
    const countryData = await countryResponse.json();
    const authorData = await authorResponse.json();
    const journalData = await journalResponse.json();

    const responseData = {
      ...worksData,
      group_by: yearData.group_by,
      type_breakdown: typeData.group_by,
      oa_breakdown: oaData.group_by,
      topic_breakdown: topicData.group_by,
      institution_breakdown: institutionData.group_by,
      country_breakdown: countryData.group_by,
      author_breakdown: authorData.group_by,
      journal_breakdown: journalData.group_by,
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Failed to fetch from OpenAlex API:', error);
    
    if (error.message?.includes('429') || error.message?.includes('rate')) {
      return NextResponse.json(
        { error: 'OpenAlex API rate limit reached. Please try again in a few moments.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch from OpenAlex API. Please try again.' },
      { status: 500 }
    );
  }
}
