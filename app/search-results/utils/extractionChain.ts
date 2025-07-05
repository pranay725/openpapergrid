import { CustomField } from '@/lib/database.types';

export interface ChunkExtractionConfig {
  chunkSize: number; // Number of characters per chunk
  overlap: number; // Overlap between chunks
  maxChunks?: number; // Maximum chunks to process (for cost control)
}

export interface ExtractionSchema {
  fields: Array<{
    id: string;
    name: string;
    type: string;
    description?: string;
    options?: string[];
  }>;
}

/**
 * Splits text into overlapping chunks for processing
 */
export function createTextChunks(
  text: string, 
  config: ChunkExtractionConfig
): string[] {
  const { chunkSize, overlap, maxChunks } = config;
  const chunks: string[] = [];
  
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    
    if (chunks.length === maxChunks) break;
    
    start += chunkSize - overlap;
  }
  
  return chunks;
}

/**
 * Generates the JSON schema for extraction based on custom fields
 */
export function generateExtractionSchema(fields: CustomField[]): string {
  const schema = {
    type: "object",
    properties: fields.reduce((acc, field) => {
      let fieldSchema: any = {
        description: field.prompt || `Extract ${field.name} from the text`
      };
      
      switch (field.type) {
        case 'text':
          fieldSchema.type = 'string';
          break;
        case 'number':
          fieldSchema.type = 'number';
          break;
        case 'boolean':
          fieldSchema.type = 'boolean';
          break;
        case 'select':
          fieldSchema.type = 'string';
          fieldSchema.enum = field.options || [];
          break;
        case 'multi_select':
          fieldSchema.type = 'array';
          fieldSchema.items = {
            type: 'string',
            enum: field.options || []
          };
          break;
      }
      
      acc[field.id] = fieldSchema;
      return acc;
    }, {} as Record<string, any>),
    required: fields.filter(f => f.enabled).map(f => f.id)
  };
  
  return JSON.stringify(schema, null, 2);
}

/**
 * Generates the initial extraction prompt
 */
export function generateInitialExtractionPrompt(
  chunk: string,
  schema: string,
  fields: CustomField[]
): string {
  const fieldDescriptions = fields.map(f => 
    `- ${f.name}: ${f.prompt || f.type}`
  ).join('\n');

  return `You are a summarisation assistant specialized in extracting structured information from scientific papers.

Write a concise JSON summary of the text below, focusing on these fields:
${fieldDescriptions}

Important: For EACH field, you must provide:
- value: The extracted information (string, number, boolean, or array depending on field type)
- confidence: A score between 0 and 1 indicating how confident you are in the extraction
- citations: An array of text snippets and their locations that support the extraction

------------
${chunk}
------------

### Output
Return **only** JSON that matches the schema.  
Do **not** add any extra keys, commentary, or markdown.
Do **not** wrap the JSON in code blocks.

Example output structure:
{
  "field_id_1": {
    "value": "Research Article",
    "confidence": 0.95,
    "citations": [
      {
        "text": "This research article presents...",
        "location": "Abstract, first sentence"
      }
    ]
  },
  "field_id_2": {
    "value": "The main objective is to...",
    "confidence": 0.9,
    "citations": [
      {
        "text": "We aimed to investigate...",
        "location": "Abstract, objectives"
      }
    ]
  }
}

Output Format (JSON Schema):
${schema}`;
}

/**
 * Generates the incremental update prompt
 */
export function generateUpdatePrompt(
  existingExtraction: any,
  newChunk: string,
  schema: string,
  fields: CustomField[]
): string {
  const fieldDescriptions = fields.map(f => 
    `- ${f.name}: ${f.prompt || f.type}`
  ).join('\n');

  return `You are a summarisation assistant specialized in extracting structured information from scientific papers.

### Task
Improve the existing JSON summary **only if** the new context adds meaningful information; otherwise return the original unmodified.

Focus on these fields:
${fieldDescriptions}

Important: For EACH field, maintain the structure:
- value: The extracted information
- confidence: A score between 0 and 1
- citations: An array of supporting text snippets and locations

### Current draft
${JSON.stringify(existingExtraction, null, 2)}

### Additional context
------------
${newChunk}
------------

### Output
Return **valid JSON only** that follows the schema below.
Only update fields where the new context provides better or additional information.
Maintain high confidence scores only when information is clearly stated.
Do **not** wrap the JSON in code blocks.

Example output structure:
{
  "field_id_1": {
    "value": "Research Article",
    "confidence": 0.95,
    "citations": [
      {
        "text": "This research article presents...",
        "location": "Abstract, first sentence"
      }
    ]
  },
  "field_id_2": {
    "value": "The main objective is to...",
    "confidence": 0.9,
    "citations": [
      {
        "text": "We aimed to investigate...",
        "location": "Abstract, objectives"
      }
    ]
  }
}

Output Format (JSON Schema):
${schema}`;
}

/**
 * Merges extraction results with confidence tracking
 */
export function mergeExtractionResults(
  existing: Record<string, any>,
  update: Record<string, any>,
  fields: CustomField[]
): Record<string, any> {
  const merged: Record<string, any> = { ...existing };
  
  for (const field of fields) {
    const fieldId = field.id;
    
    // Skip if no update for this field
    if (!(fieldId in update)) continue;
    
    const existingValue = existing[fieldId];
    const updateValue = update[fieldId];
    
    // If no existing value, use the update
    if (!existingValue || existingValue.value === null || existingValue.value === '') {
      merged[fieldId] = updateValue;
      continue;
    }
    
    // If update has higher confidence, use it
    if (updateValue.confidence > existingValue.confidence) {
      merged[fieldId] = updateValue;
      continue;
    }
    
    // For multi-select, merge arrays
    if (field.type === 'multi_select' && Array.isArray(existingValue.value) && Array.isArray(updateValue.value)) {
      const mergedValues = [...new Set([...existingValue.value, ...updateValue.value])];
      merged[fieldId] = {
        value: mergedValues,
        confidence: Math.max(existingValue.confidence, updateValue.confidence),
        citations: [...(existingValue.citations || []), ...(updateValue.citations || [])]
      };
    }
  }
  
  return merged;
}

/**
 * Configuration for different extraction modes
 */
export const EXTRACTION_CONFIGS = {
  abstract: {
    chunkSize: 2000, // Abstracts are short, process in one chunk
    overlap: 0,
    maxChunks: 1
  },
  fulltext: {
    chunkSize: 3000, // ~750 tokens per chunk
    overlap: 500, // Some overlap to maintain context
    maxChunks: 10 // Limit to ~30k characters for cost control
  }
} as const; 