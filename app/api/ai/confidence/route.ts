import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Schema for confidence analysis
const confidenceAnalysisSchema = z.object({
  fieldScores: z.array(z.object({
    fieldId: z.string(),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
    evidenceStrength: z.enum(['strong', 'moderate', 'weak', 'none']),
    issues: z.array(z.string()).optional()
  })),
  overallConfidence: z.number().min(0).max(1),
  recommendations: z.array(z.string())
});

export async function POST(request: NextRequest) {
  try {
    const { 
      sourceText, 
      extractedFields, 
      provider = 'openrouter',
      model = 'openrouter/cypher-alpha:free'
    } = await request.json();

    if (!sourceText || !extractedFields || extractedFields.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the appropriate AI provider
    let aiProvider;
    if (provider === 'openrouter') {
      aiProvider = createOpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: process.env.OPENROUTER_API_KEY!,
      });
    } else {
      aiProvider = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY!,
      });
    }

    // Build the prompt for confidence analysis
    const prompt = `You are an expert at verifying information extraction accuracy. Analyze the following extracted values against the source text and assign confidence scores.

SOURCE TEXT:
${sourceText}

EXTRACTED FIELDS:
${extractedFields.map((field: any) => `
Field: ${field.name} (${field.type})
Extracted Value: ${JSON.stringify(field.value)}
Original Confidence: ${field.confidence || 'N/A'}
Citations: ${field.citations ? JSON.stringify(field.citations) : 'None'}
`).join('\n')}

CONFIDENCE SCORING GUIDELINES:
- 1.0 (100%): Exact match found in text with clear, unambiguous evidence
- 0.8-0.9 (80-90%): Strong evidence with minor interpretation required
- 0.6-0.7 (60-70%): Moderate evidence, some inference needed
- 0.4-0.5 (40-50%): Weak evidence, significant inference required
- 0.2-0.3 (20-30%): Very weak evidence, mostly guesswork
- 0.0-0.1 (0-10%): No evidence found or contradictory information

For each field:
1. Check if the extracted value can be verified in the source text
2. Assess the strength and clarity of supporting evidence
3. Identify any potential issues or contradictions
4. Provide reasoning for the confidence score

Also provide an overall confidence score for the entire extraction and recommendations for improvement.`;

    // Generate confidence analysis
    const { object } = await generateObject({
      model: aiProvider(model),
      schema: confidenceAnalysisSchema,
      prompt,
      temperature: 0.3, // Lower temperature for more consistent scoring
    });

    return NextResponse.json({
      analysis: object,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Confidence scoring error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze confidence' },
      { status: 500 }
    );
  }
} 