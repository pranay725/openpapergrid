import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { NextRequest } from 'next/server';

// Schema for field extraction
const FieldExtractionSchema = z.object({
  value: z.any(),
  confidence: z.number().min(0).max(1),
  citations: z.array(z.object({
    text: z.string(),
    location: z.string()
  }))
});

// Create OpenRouter client
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'OpenPaper Grid',
  }
});

// Provider configuration
const AI_PROVIDERS = {
  openai: {
    models: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'],
    getModel: (model: string) => openai(model)
  },
  anthropic: {
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    getModel: (model: string) => anthropic(model)
  },
  openrouter: {
    models: [
      'openrouter/cypher-alpha:free',
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3-opus',
      'anthropic/claude-3-sonnet',
      'anthropic/claude-3-haiku',
      'openai/gpt-4-turbo',
      'openai/gpt-4',
      'openai/gpt-3.5-turbo',
      'google/gemini-pro-1.5',
      'meta-llama/llama-3.1-70b-instruct',
      'meta-llama/llama-3.1-8b-instruct',
      'mistralai/mistral-large',
      'deepseek/deepseek-chat'
    ],
    getModel: (model: string) => openrouter(model)
  }
};

// Generate extraction prompt based on field configuration
function generateExtractionPrompt(
  field: any,
  fullText: string,
  sections: Record<string, string>
): string {
  const contextParts = [];
  
  // Add relevant sections based on field type
  if (sections.abstract) {
    contextParts.push(`ABSTRACT:\n${sections.abstract}`);
  }
  
  if (field.id === 'methods' || field.id === 'techniques' || field.id === 'model_system') {
    if (sections.methods) {
      contextParts.push(`METHODS:\n${sections.methods}`);
    }
  }
  
  if (field.id === 'results' || field.id === 'primary_outcome' || field.id === 'main_findings') {
    if (sections.results) {
      contextParts.push(`RESULTS:\n${sections.results}`);
    }
  }
  
  // If no specific sections, use truncated full text
  if (contextParts.length === 0) {
    contextParts.push(`FULL TEXT (truncated):\n${fullText.substring(0, 3000)}...`);
  }
  
  const context = contextParts.join('\n\n');
  
  return `You are an expert biomedical researcher extracting structured information from scientific papers.

PAPER CONTEXT:
${context}

EXTRACTION TASK:
Field Name: ${field.name}
Field Type: ${field.type}
${field.options ? `Options: ${field.options.join(', ')}` : ''}
${field.prompt ? `Specific Instructions: ${field.prompt}` : ''}

Please extract the value for this field from the paper. Provide:
1. The extracted value (matching the field type exactly)
2. A confidence score between 0 and 1
3. Citations showing where in the text you found this information

For multi_select fields, return an array of selected options.
For boolean fields, return true or false.
For text fields, be concise but complete.
For number fields, extract the numeric value only.

Respond in JSON format matching this structure:
{
  "value": <extracted value>,
  "confidence": <0-1>,
  "citations": [
    {
      "text": "quoted text from paper",
      "location": "Section, paragraph or line reference"
    }
  ]
}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      field, 
      fullText, 
      sections = {}, 
      provider = 'openai', 
      model,
      workId 
    } = body;
    
    if (!field || !fullText || !workId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate provider and model
    const providerConfig = AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS];
    if (!providerConfig) {
      return new Response(
        JSON.stringify({ error: 'Invalid AI provider' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const selectedModel = model || providerConfig.models[0];
    if (!providerConfig.models.includes(selectedModel)) {
      return new Response(
        JSON.stringify({ error: 'Invalid model for provider' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate the extraction prompt
    const prompt = generateExtractionPrompt(field, fullText, sections);
    
    // Stream the AI response
    const result = await streamText({
      model: providerConfig.getModel(selectedModel),
      prompt,
      temperature: 0.1, // Low temperature for consistency
      maxTokens: 500,
    });
    
    // Convert to text stream response with custom handling
    const stream = result.textStream;
    let accumulated = '';
    
    const transformedStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          accumulated += chunk;
          controller.enqueue(new TextEncoder().encode(chunk));
          
          // Try to parse accumulated text as complete JSON
          try {
            const parsed = JSON.parse(accumulated);
            // If we have valid JSON, we could notify about it
          } catch (e) {
            // Not complete JSON yet, continue
          }
        }
        controller.close();
      }
    });
    
    return new Response(transformedStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      }
    });
    
  } catch (error) {
    console.error('AI extraction error:', error);
    return new Response(
      JSON.stringify({ error: 'AI extraction failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 