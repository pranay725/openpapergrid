import { streamText, generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { NextRequest } from 'next/server';
import { 
  createTextChunks, 
  generateExtractionSchema,
  generateInitialExtractionPrompt,
  generateUpdatePrompt,
  mergeExtractionResults,
  EXTRACTION_CONFIGS
} from '@/app/search-results/utils/extractionChain';

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
  openrouter: {
    models: [
      'openrouter/cypher-alpha:free',
      'google/gemma-3n-e4b-it:free',
      'google/gemini-2.5-flash-preview-05-20',
      'openai/gpt-4.1'
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
  
  // Add title if available
  if (sections.title) {
    contextParts.push(`TITLE:\n${sections.title}`);
  }
  
  // Add relevant sections based on field type
  if (sections.abstract) {
    contextParts.push(`ABSTRACT:\n${sections.abstract}`);
  }
  
  // Only include additional sections if they exist (fulltext mode)
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

Respond with ONLY valid JSON (no markdown, no code blocks, no extra text) matching this structure:
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
    // Check authentication
    const { createSupabaseServerClient } = await import('@/lib/supabase-server');
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    // Track usage
    if (session?.user?.id) {
      const { trackUsage } = await import('@/lib/rate-limiter');
      await trackUsage(session.user.id, 'abstract_extractions');
    }
    
    const body = await request.json();
    const { 
      fields, // Now expecting array of fields instead of single field
      fullText, 
      sections = {}, 
      provider = 'openai', 
      model,
      workId,
      mode = 'fulltext' // 'abstract' or 'fulltext'
    } = body;
    
    // If full text mode and not authenticated, reject
    if (mode === 'fulltext' && !session) {
      return new Response(
        JSON.stringify({ error: 'Authentication required for full text extraction' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!fields || !fullText || !workId) {
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
    
    // Get extraction configuration based on mode
    const extractionConfig = EXTRACTION_CONFIGS[mode as keyof typeof EXTRACTION_CONFIGS];
    
    // Create text chunks
    const chunks = createTextChunks(fullText, extractionConfig);
    
    // Generate JSON schema for all fields
    const schema = generateExtractionSchema(fields);
    
    // Initialize extraction results
    let extractionResults: Record<string, any> = {};
    
    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Process each chunk
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const isFirstChunk = i === 0;
            
            // Generate appropriate prompt
            const prompt = isFirstChunk
              ? generateInitialExtractionPrompt(chunk, schema, fields)
              : generateUpdatePrompt(extractionResults, chunk, schema, fields);
            
            // Use generateObject for structured output
            const result = await generateObject({
              model: providerConfig.getModel(selectedModel),
              prompt,
              schema: z.object(
                fields.reduce((acc: Record<string, any>, field: any) => {
                  // Create proper schema based on field type
                  let valueSchema;
                  switch (field.type) {
                    case 'text':
                      valueSchema = z.string();
                      break;
                    case 'number':
                      valueSchema = z.number();
                      break;
                    case 'boolean':
                      valueSchema = z.boolean();
                      break;
                    case 'select':
                      valueSchema = field.options && field.options.length > 0 
                        ? z.enum(field.options as [string, ...string[]]) 
                        : z.string();
                      break;
                    case 'multi_select':
                      valueSchema = field.options && field.options.length > 0
                        ? z.array(z.enum(field.options as [string, ...string[]]))
                        : z.array(z.string());
                      break;
                    case 'date':
                      valueSchema = z.string(); // ISO date string
                      break;
                    case 'url':
                      valueSchema = z.string(); // Just string, not strict URL validation
                      break;
                    default:
                      valueSchema = z.string(); // Fallback to string
                  }
                  
                  acc[field.id] = z.object({
                    value: valueSchema,
                    confidence: z.number().min(0).max(1),
                    citations: z.array(z.object({
                      text: z.string(),
                      location: z.string()
                    }))
                  });
                  return acc;
                }, {} as Record<string, any>)
              ),
              temperature: 0.1,
            });
            
            // Capture usage data - the AI SDK returns it directly on the result
            const usage = result.usage || (result as any).rawResponse?.usage;
            
            // Log for debugging
            console.log('AI SDK Result structure:', {
              hasUsage: !!result.usage,
              hasRawResponse: !!(result as any).rawResponse,
              usage: usage
            });
            
            // Merge results
            extractionResults = mergeExtractionResults(
              extractionResults, 
              result.object,
              fields
            );
            
            // Stream progress update with usage data
            const progressUpdate = {
              type: 'progress',
              chunk: i + 1,
              totalChunks: chunks.length,
              currentResults: extractionResults,
              usage: usage ? {
                promptTokens: usage.promptTokens,
                completionTokens: usage.completionTokens,
                totalTokens: usage.totalTokens
              } : undefined
            };
            
            controller.enqueue(encoder.encode(
              JSON.stringify(progressUpdate) + '\n'
            ));
          }
          
          // Send final results
          const finalUpdate = {
            type: 'complete',
            results: extractionResults
          };
          
          controller.enqueue(encoder.encode(
            JSON.stringify(finalUpdate) + '\n'
          ));
          
        } catch (error) {
          console.error('Extraction error:', error);
          const errorUpdate = {
            type: 'error',
            error: error instanceof Error ? error.message : 'Extraction failed'
          };
          controller.enqueue(encoder.encode(
            JSON.stringify(errorUpdate) + '\n'
          ));
        } finally {
          controller.close();
        }
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
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