import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const BOOLEAN_QUERY_PROMPT = `You are generating a Boolean search query optimized for OpenAlex full-text search. Follow these instructions carefully:

Use only Boolean operators (AND, OR, NOT) to connect keywords.

Use quotes for exact phrases (e.g., "gene therapy").

Use parentheses to group synonyms or related terms.

Do not include any field prefixes like author:, year:, journal:, etc.

Do not suggest filters for publication years, author names, journal titles, or affiliations.

Focus only on keywords and concepts that would appear in the full text of the paper.

Make the query comprehensive by including synonyms, acronyms, spelling variants, and related terms, but avoid introducing unrelated false positives.

Use NOT to exclude likely sources of irrelevant results (e.g., mouse models when the focus is human studies).

Keep the query readable with clean logical structure and correct parentheses.

Goal:
Maximize recall without sacrificing precision — include as many valid synonyms and phrasings as necessary, but avoid adding noise.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, existingQuery, action } = body;

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    let prompt = '';
    
    if (action === 'refine' && existingQuery) {
      prompt = `${BOOLEAN_QUERY_PROMPT}

Current query: ${existingQuery}

User feedback: ${description}

Generate an improved Boolean query based on the user's feedback. Maintain the core concept but adjust based on their input.

Output only the Boolean query, no explanation.`;
    } else {
      prompt = `${BOOLEAN_QUERY_PROMPT}

User's research description: ${description}

Generate a comprehensive Boolean search query for this research topic.

Output only the Boolean query, no explanation.`;
    }

    const { text } = await generateText({
      model: openai('gpt-4o'),
      prompt,
      temperature: 0.3,
      maxTokens: 500,
    });

    // Clean up the query - remove any explanatory text if present
    const query = text.trim()
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .split('\n')[0]; // Take only the first line

    return NextResponse.json({ query });
  } catch (error) {
    console.error('Error generating Boolean query:', error);
    return NextResponse.json(
      { error: 'Failed to generate query' },
      { status: 500 }
    );
  }
}