import { useState, useCallback, useRef } from 'react';
import { useCompletion } from 'ai/react';
import { SearchResult, CustomField, AIResponse } from '../types';

export type ExtractionStatus = 'idle' | 'fetching' | 'extracting' | 'completed' | 'error';

interface ExtractionState {
  status: ExtractionStatus;
  progress: number; // 0-100
  currentField?: string;
  error?: string;
}

interface UseFullTextExtractionProps {
  onFieldExtracted?: (workId: string, fieldId: string, response: AIResponse) => void;
  onFieldStreaming?: (workId: string, fieldId: string, partial: string) => void;
  provider?: string;
  model?: string;
}

export const useFullTextExtraction = ({
  onFieldExtracted,
  onFieldStreaming,
  provider = 'openai',
  model = 'gpt-3.5-turbo'
}: UseFullTextExtractionProps = {}) => {
  const [extractionStates, setExtractionStates] = useState<Record<string, ExtractionState>>({});
  const [fullTextCache, setFullTextCache] = useState<Record<string, any>>({});
  const [extractionPrompts, setExtractionPrompts] = useState<Record<string, Array<any>>>({});
  const abortControllers = useRef<Record<string, AbortController>>({});

  // Update extraction state for a work
  const updateExtractionState = useCallback((workId: string, update: Partial<ExtractionState>) => {
    setExtractionStates(prev => ({
      ...prev,
      [workId]: {
        ...prev[workId],
        ...update
      }
    }));
  }, []);

  // Fetch full text for a work
  const fetchFullText = useCallback(async (work: SearchResult) => {
    const workId = work.id;
    
    // Check cache first
    if (fullTextCache[workId]) {
      return fullTextCache[workId];
    }

    updateExtractionState(workId, { status: 'fetching', progress: 10 });

    try {
      // Extract PMID from the work's IDs
      const pmid = work.ids?.pmid?.replace('https://pubmed.ncbi.nlm.nih.gov/', '');
      const pdfUrl = work.open_access?.oa_url;

      const response = await fetch('/api/fulltext', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workId,
          pmid,
          doi: work.doi,
          pdfUrl
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch full text');
      }

      const fullTextData = await response.json();
      
      // Cache the result
      setFullTextCache(prev => ({
        ...prev,
        [workId]: fullTextData
      }));

      updateExtractionState(workId, { progress: 30 });
      return fullTextData;
    } catch (error) {
      updateExtractionState(workId, { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Failed to fetch full text' 
      });
      throw error;
    }
  }, [fullTextCache, updateExtractionState]);

  // Generate extraction prompt (matching the API logic)
  const generatePrompt = (field: CustomField, fullText: string, sections: Record<string, string>) => {
    const contextParts = [];
    
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
  };

  // Extract a single field using AI
  const extractField = useCallback(async (
    work: SearchResult,
    field: CustomField,
    fullTextData: any,
    signal?: AbortSignal
  ): Promise<AIResponse> => {
    const response = await fetch('/api/ai/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workId: work.id,
        field,
        fullText: fullTextData.fullText,
        sections: fullTextData.sections,
        provider,
        model
      }),
      signal
    });

    if (!response.ok) {
      throw new Error('AI extraction failed');
    }

    // Handle streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      accumulated += chunk;
      
      // Try to parse accumulated text as JSON for streaming updates
      try {
        const parsed = JSON.parse(accumulated);
        if (parsed.value && onFieldStreaming) {
          onFieldStreaming(work.id, field.id, JSON.stringify(parsed.value));
        }
      } catch (e) {
        // Not complete JSON yet, continue accumulating
      }
    }

    // Parse the final response
    try {
      const result = JSON.parse(accumulated);
      return result;
    } catch (e) {
      console.error('Failed to parse response:', e);
      console.error('Accumulated text:', accumulated);
      
      // Try to extract valid JSON from partial response
      const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e2) {
          console.error('Failed to parse extracted JSON:', e2);
        }
      }
      
      throw new Error(`Failed to parse AI response: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [provider, model]);

  // Process all fields for a work
  const processWork = useCallback(async (
    work: SearchResult,
    fields: CustomField[]
  ) => {
    const workId = work.id;
    
    // Create abort controller for this work
    const abortController = new AbortController();
    abortControllers.current[workId] = abortController;

    try {
      // Fetch full text
      const fullTextData = await fetchFullText(work);
      
      // Filter to only AI-enabled fields
      const aiFields = fields.filter(f => f.isAI && f.enabled);
      const totalFields = aiFields.length;
      
      updateExtractionState(workId, { status: 'extracting', progress: 30 });

      // Process each field
      for (let i = 0; i < aiFields.length; i++) {
        const field = aiFields[i];
        
        if (abortController.signal.aborted) {
          break;
        }

        updateExtractionState(workId, { 
          currentField: field.name,
          progress: 30 + (70 * (i / totalFields))
        });

        try {
          // Store the prompt
          const prompt = generatePrompt(field, fullTextData.fullText, fullTextData.sections || {});
          setExtractionPrompts(prev => ({
            ...prev,
            [workId]: [...(prev[workId] || []), { field, prompt }]
          }));
          
          const response = await extractField(work, field, fullTextData, abortController.signal);
          
          // Update the stored prompt with the response
          setExtractionPrompts(prev => ({
            ...prev,
            [workId]: prev[workId].map(p => 
              p.field.id === field.id ? { ...p, response } : p
            )
          }));
          
          if (onFieldExtracted) {
            onFieldExtracted(workId, field.id, response);
          }
        } catch (error) {
          console.error(`Failed to extract field ${field.name}:`, error);
          // Continue with other fields even if one fails
        }
      }

      updateExtractionState(workId, { 
        status: 'completed', 
        progress: 100,
        currentField: undefined
      });

    } catch (error) {
      if (!abortController.signal.aborted) {
        updateExtractionState(workId, { 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Processing failed' 
        });
      }
    } finally {
      delete abortControllers.current[workId];
    }
  }, [fetchFullText, extractField, onFieldExtracted, onFieldStreaming, updateExtractionState]);

  // Cancel extraction for a work
  const cancelExtraction = useCallback((workId: string) => {
    const controller = abortControllers.current[workId];
    if (controller) {
      controller.abort();
      delete abortControllers.current[workId];
      updateExtractionState(workId, { 
        status: 'idle', 
        progress: 0,
        currentField: undefined
      });
    }
  }, [updateExtractionState]);

  // Get extraction state for a work
  const getExtractionState = useCallback((workId: string): ExtractionState => {
    return extractionStates[workId] || { status: 'idle', progress: 0 };
  }, [extractionStates]);

  // Get full text data for a work
  const getFullTextData = useCallback((workId: string) => {
    return fullTextCache[workId];
  }, [fullTextCache]);
  
  // Get extraction prompts for a work
  const getExtractionPrompts = useCallback((workId: string) => {
    return extractionPrompts[workId] || [];
  }, [extractionPrompts]);

  return {
    processWork,
    cancelExtraction,
    getExtractionState,
    extractionStates,
    getFullTextData,
    getExtractionPrompts
  };
}; 