import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const prompt = `Summarize this Boolean search query into a concise, human-readable title (max 5 words).
Focus on the main research topic, ignoring Boolean operators.

Query: ${query}

Output only the title, no explanation or quotes.`;

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt,
      temperature: 0.3,
      maxTokens: 20,
    });

    const summary = text.trim()
      .replace(/^["']|["']$/g, '') // Remove quotes
      .replace(/\.$/, ''); // Remove trailing period

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error summarizing query:', error);
    
    // Fallback to simple extraction
    const keywords = query
      .replace(/[()]/g, ' ')
      .replace(/\b(AND|OR|NOT)\b/g, ' ')
      .split(/\s+/)
      .filter((word: string) => word.length > 3 && !word.startsWith('"'))
      .slice(0, 3)
      .join(' ');
    
    return NextResponse.json({ 
      summary: keywords || 'Search Results' 
    });
  }
}