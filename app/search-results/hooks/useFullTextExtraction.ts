import { useState, useCallback, useRef, useEffect } from 'react';
import { useCompletion } from 'ai/react';
import { SearchResult, CustomField, AIResponse, ExtractionMetrics } from '../types';
import { prepareAbstractData, prepareAbstractDataWithScraping } from '../utils/abstractHelpers';
import { SearchResult, CustomField, AIResponse, ExtractionMetrics } from '../types';
import { prepareAbstractData, prepareAbstractDataWithScraping } from '../utils/abstractHelpers';

export type ExtractionStatus = 'idle' | 'fetching' | 'extracting' | 'completed' | 'error';

export interface ExtractionState {
  status: ExtractionStatus;
  progress: number; // 0-100
  currentField?: string;
  error?: string;
}

interface FullTextData {
  fullText: string;
  sections: Record<string, string>;
  wasScraped?: boolean;
  abstractLength?: number;
  fullTextLength?: number;
}

interface FullTextData {
  fullText: string;
  sections: Record<string, string>;
  wasScraped?: boolean;
  abstractLength?: number;
  fullTextLength?: number;
}

interface UseFullTextExtractionProps {
  onFieldExtracted?: (workId: string, fieldId: string, response: AIResponse) => void;
  onFieldStreaming?: (workId: string, fieldId: string, partial: string) => void;
  provider?: string;
  model?: string;
  mode?: 'abstract' | 'fulltext';
  mode?: 'abstract' | 'fulltext';
}

export const useFullTextExtraction = ({
  onFieldExtracted,
  onFieldStreaming,
  provider = 'openrouter',
  model = 'openrouter/cypher-alpha:free',
  mode = 'abstract'
}: UseFullTextExtractionProps) => {
  const [extractionStates, setExtractionStates] = useState<Record<string, ExtractionState>>({});
  const [fullTextCache, setFullTextCache] = useState<Record<string, FullTextData>>({});
  const [extractionPrompts, setExtractionPrompts] = useState<Record<string, Array<{ field: CustomField; response: AIResponse }>>>({});
  const [extractionMetrics, setExtractionMetrics] = useState<Record<string, ExtractionMetrics>>({});
  const abortControllers = useRef<Record<string, AbortController>>({});
  
  // Track retry counts
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});
  const MAX_RETRIES = 3;
  
  // Use a ref to always have the current mode value
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

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
  const fetchFullText = useCallback(async (work: SearchResult): Promise<FullTextData & { source?: string }> => {
  const fetchFullText = useCallback(async (work: SearchResult): Promise<FullTextData & { source?: string }> => {
    const workId = work.id;
    
    // Check cache first
    if (fullTextCache[workId]) {
      return fullTextCache[workId];
    }

    updateExtractionState(workId, { status: 'fetching', progress: 10 });

    try {
      // Extract PMID from the work's IDs
      const pmid = work.ids?.pmid?.replace('https://pubmed.ncbi.nlm.nih.gov/', '');
      const pdfUrl = work.primary_location?.pdf_url;
      const pdfUrl = work.primary_location?.pdf_url;

      const response = await fetch('/api/fulltext', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workId,
          pmid,
          doi: work.doi,
          pdfUrl,
          landingPageUrl: work.primary_location?.landing_page_url
          pdfUrl,
          landingPageUrl: work.primary_location?.landing_page_url
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch full text');
      }

      const responseData = await response.json();
      
      // Transform response to our FullTextData format
      const fullTextData: FullTextData & { source?: string } = {
        fullText: responseData.fullText,
        sections: responseData.sections || {},
        fullTextLength: responseData.fullText?.length || 0,
        source: responseData.source // This will be 'pmc', 'pdf', or 'firecrawl'
      };
      const responseData = await response.json();
      
      // Transform response to our FullTextData format
      const fullTextData: FullTextData & { source?: string } = {
        fullText: responseData.fullText,
        sections: responseData.sections || {},
        fullTextLength: responseData.fullText?.length || 0,
        source: responseData.source // This will be 'pmc', 'pdf', or 'firecrawl'
      };
      
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
  const generatePrompt = (field: CustomField, fullText: string, sections: Record<string, string>, mode: 'abstract' | 'fulltext') => {
  const generatePrompt = (field: CustomField, fullText: string, sections: Record<string, string>, mode: 'abstract' | 'fulltext') => {
    const contextParts = [];
    
    // Always include title if available
    if (sections.title) {
      contextParts.push(`TITLE:\n${sections.title}`);
    }
    
    // Always include title if available
    if (sections.title) {
      contextParts.push(`TITLE:\n${sections.title}`);
    }
    
    if (sections.abstract) {
      contextParts.push(`ABSTRACT:\n${sections.abstract}`);
    }
    
    // Only include additional sections in fulltext mode
    if (mode === 'fulltext') {
      if (field.id === 'methods' || field.id === 'techniques' || field.id === 'model_system') {
        if (sections.methods) {
          contextParts.push(`METHODS:\n${sections.methods}`);
        }
      }
      
      if (field.id === 'results' || field.id === 'primary_outcome' || field.id === 'main_findings') {
        if (sections.results) {
          contextParts.push(`RESULTS:\n${sections.results}`);
        }
    // Only include additional sections in fulltext mode
    if (mode === 'fulltext') {
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

  // Extract all fields using the rolling window approach
  const extractFields = useCallback(async (
  // Extract all fields using the rolling window approach
  const extractFields = useCallback(async (
    work: SearchResult,
    fields: CustomField[],
    fields: CustomField[],
    fullTextData: any,
    signal?: AbortSignal,
    metrics?: Partial<ExtractionMetrics>
  ): Promise<{ results: Record<string, AIResponse>, usage?: any }> => {
    signal?: AbortSignal,
    metrics?: Partial<ExtractionMetrics>
  ): Promise<{ results: Record<string, AIResponse>, usage?: any }> => {
    const response = await fetch('/api/ai/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workId: work.id,
        fields,
        fields,
        fullText: fullTextData.fullText,
        sections: fullTextData.sections,
        provider,
        model,
        mode: modeRef.current
      }),
      signal
    });

    if (!response.ok) {
      throw new Error('AI extraction failed');
    }

    // Handle streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let totalUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    };
    let buffer = '';
    let totalUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    };

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      
      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        try {
          const update = JSON.parse(line);
          
          if (update.type === 'progress' && update.currentResults) {
            // Accumulate usage data
            if (update.usage) {
              totalUsage.promptTokens += update.usage.promptTokens || 0;
              totalUsage.completionTokens += update.usage.completionTokens || 0;
              totalUsage.totalTokens += update.usage.totalTokens || 0;
            }
            
            // Stream updates for each field
            for (const [fieldId, result] of Object.entries(update.currentResults)) {
              if (onFieldStreaming && result) {
                onFieldStreaming(work.id, fieldId, JSON.stringify((result as any).value));
              }
            }
          } else if (update.type === 'complete') {
            return { results: update.results, usage: totalUsage };
          } else if (update.type === 'error') {
            throw new Error(update.error);
          }
        } catch (e) {
          console.error('Failed to parse streaming update:', e);
      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        try {
          const update = JSON.parse(line);
          
          if (update.type === 'progress' && update.currentResults) {
            // Accumulate usage data
            if (update.usage) {
              totalUsage.promptTokens += update.usage.promptTokens || 0;
              totalUsage.completionTokens += update.usage.completionTokens || 0;
              totalUsage.totalTokens += update.usage.totalTokens || 0;
            }
            
            // Stream updates for each field
            for (const [fieldId, result] of Object.entries(update.currentResults)) {
              if (onFieldStreaming && result) {
                onFieldStreaming(work.id, fieldId, JSON.stringify((result as any).value));
              }
            }
          } else if (update.type === 'complete') {
            return { results: update.results, usage: totalUsage };
          } else if (update.type === 'error') {
            throw new Error(update.error);
          }
        } catch (e) {
          console.error('Failed to parse streaming update:', e);
        }
      }
    }

    throw new Error('Extraction completed without final results');
  }, [provider, model, onFieldStreaming]);

  // Process all fields for a work with retry logic
  const processWork = useCallback(async (
    work: SearchResult,
    fields: CustomField[],
    forceRefresh: boolean = false
  ) => {
    const workId = work.id;
    
    // Clear cache if forcing refresh
    if (forceRefresh) {
      setFullTextCache(prev => {
        const newCache = { ...prev };
        delete newCache[workId];
        return newCache;
      });
      setExtractionPrompts(prev => {
        const newPrompts = { ...prev };
        delete newPrompts[workId];
        return newPrompts;
      });
      setExtractionMetrics(prev => {
        const newMetrics = { ...prev };
        delete newMetrics[workId];
        return newMetrics;
      });
    }
    
    // Create abort controller for this work
    const abortController = new AbortController();
    abortControllers.current[workId] = abortController;

    try {
      // Initialize metrics
      const startTime = Date.now();
      let abstractSource: ExtractionMetrics['abstractSource'] = 'openalex';
      let scrapingDuration: number | undefined;
      let scrapedFrom: string | undefined;
      let fullTextData: FullTextData;
      
      if (modeRef.current === 'abstract') {
        // For abstract mode, reconstruct abstract from inverted index if needed
        // and attempt scraping if no abstract is available
        const scrapingStartTime = Date.now();
        const abstractData = await prepareAbstractDataWithScraping(work);
        
        if (!abstractData.hasAbstract) {
          throw new Error('No abstract available for this work (tried scraping)');
        }
        
        // Determine abstract source
        if (abstractData.wasScraped) {
          abstractSource = 'scraped';
          scrapingDuration = Date.now() - scrapingStartTime;
          scrapedFrom = work.primary_location?.landing_page_url || work.doi;
        } else if (work.abstract_inverted_index) {
          abstractSource = 'openalex_inverted';
        }
        
        // Create a structured format with title and abstract
        fullTextData = {
          fullText: `Title: ${abstractData.title}\n\nAbstract: ${abstractData.abstract}`,
          sections: {
            title: abstractData.title,
            abstract: abstractData.abstract
          },
          wasScraped: abstractData.wasScraped,
          abstractLength: abstractData.abstract.length
        };
        
        // Cache the abstract data
        setFullTextCache(prev => ({
          ...prev,
          [workId]: fullTextData
        }));
        
        updateExtractionState(workId, { status: 'extracting', progress: 30 });
      } else {
        // Fetch full text for fulltext mode
        abstractSource = 'fulltext';
        const fullTextResponse = await fetchFullText(work);
        fullTextData = fullTextResponse;
        fullTextData.fullTextLength = fullTextData.fullText?.length || 0;
      }
      
      // Filter to only AI-enabled fields
      const aiFields = fields.filter(f => f.isAI && f.enabled);
      
      if (aiFields.length === 0) {
        updateExtractionState(workId, { 
          status: 'completed', 
          progress: 100
        });
        return;
      }
      
      if (aiFields.length === 0) {
        updateExtractionState(workId, { 
          status: 'completed', 
          progress: 100
        });
        return;
      }
      
      updateExtractionState(workId, { status: 'extracting', progress: 30 });

      try {
        // Extract all fields at once using the rolling window approach
        const { results, usage } = await extractFields(work, aiFields, fullTextData, abortController.signal);
        
        // Build field metrics
        const fieldMetrics: Record<string, any> = {};
        
        // Process the results
        for (const [fieldId, response] of Object.entries(results)) {
          const field = aiFields.find(f => f.id === fieldId);
          if (!field) continue;
          
          // Store field metrics
          fieldMetrics[fieldId] = {
            confidence: response.confidence,
            // Could add per-field token counts if we track them
          };
      try {
        // Extract all fields at once using the rolling window approach
        const { results, usage } = await extractFields(work, aiFields, fullTextData, abortController.signal);
        
        // Build field metrics
        const fieldMetrics: Record<string, any> = {};
        
        // Process the results
        for (const [fieldId, response] of Object.entries(results)) {
          const field = aiFields.find(f => f.id === fieldId);
          if (!field) continue;
          
          // Store field metrics
          fieldMetrics[fieldId] = {
            confidence: response.confidence,
            // Could add per-field token counts if we track them
          };
          
          // Store the extraction details for debugging
          // Store the extraction details for debugging
          setExtractionPrompts(prev => ({
            ...prev,
            [workId]: [...(prev[workId] || []), { field, response }]
            [workId]: [...(prev[workId] || []), { field, response }]
          }));
          
          if (onFieldExtracted) {
            onFieldExtracted(workId, fieldId, response);
            onFieldExtracted(workId, fieldId, response);
          }
        }
        
        // Calculate final metrics
        const endTime = Date.now();
        const metrics: ExtractionMetrics = {
          startTime,
          endTime,
          duration: endTime - startTime,
          abstractSource,
          abstractLength: fullTextData.abstractLength,
          fullTextLength: fullTextData.fullTextLength,
          fullTextSource: modeRef.current === 'fulltext' && 'source' in fullTextData ? fullTextData.source as 'pmc' | 'pdf' | 'firecrawl' : undefined,
          scrapingDuration,
          scrapedFrom,
          model,
          provider,
          chunksProcessed: modeRef.current === 'abstract' ? 1 : undefined,
          totalChunks: modeRef.current === 'abstract' ? 1 : undefined,
          promptTokens: usage?.promptTokens,
          completionTokens: usage?.completionTokens,
          totalTokens: usage?.totalTokens,
          fieldMetrics
        };
        
        // Store metrics
        setExtractionMetrics(prev => ({
          ...prev,
          [workId]: metrics
        }));
        
        // Reset retry count on success
        setRetryCount(prev => {
          const newCount = { ...prev };
          delete newCount[workId];
          return newCount;
        });
      } catch (error) {
        console.error('Failed to extract fields:', error);
        // The error is already handled in the outer try-catch
        throw error;
      }

      updateExtractionState(workId, { 
        status: 'completed', 
        progress: 100,
        currentField: undefined
      });

    } catch (error) {
      if (!abortController.signal.aborted) {
        const currentRetries = retryCount[workId] || 0;
        
        updateExtractionState(workId, { 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Processing failed',
          progress: 0
        });
        
        // Update retry count
        setRetryCount(prev => ({
          ...prev,
          [workId]: currentRetries + 1
        }));
      }
    } finally {
      delete abortControllers.current[workId];
    }
  }, [fetchFullText, extractFields, onFieldExtracted, onFieldStreaming, updateExtractionState, retryCount]);

  // Extract a single field for a work
  const extractSingleField = useCallback(async (
    work: SearchResult,
    field: CustomField,
    forceRefresh: boolean = false
  ) => {
    const workId = work.id;
    
    // Check if we have cached full text data
    let fullTextData = fullTextCache[workId];
    
    if (!fullTextData || forceRefresh) {
      // Need to fetch the data first
      updateExtractionState(workId, { status: 'fetching', progress: 10 });
      
      try {
        if (modeRef.current === 'abstract') {
          const abstractData = await prepareAbstractDataWithScraping(work);
          if (!abstractData.hasAbstract) {
            throw new Error('No abstract available');
          }
          
          fullTextData = {
            fullText: `Title: ${abstractData.title}\n\nAbstract: ${abstractData.abstract}`,
            sections: {
              title: abstractData.title,
              abstract: abstractData.abstract
            },
            wasScraped: abstractData.wasScraped,
            abstractLength: abstractData.abstract.length
          };
          
          setFullTextCache(prev => ({
            ...prev,
            [workId]: fullTextData
          }));
        } else {
          fullTextData = await fetchFullText(work);
        }
      } catch (error) {
        updateExtractionState(workId, { 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Failed to fetch text'
        });
        throw error;
      }
    }
    
    // Now extract just this field
    updateExtractionState(workId, { 
      status: 'extracting', 
      progress: 50,
      currentField: field.name
    });
    
    try {
      const { results } = await extractFields(work, [field], fullTextData);
      const response = results[field.id];
      
      if (response && onFieldExtracted) {
        onFieldExtracted(workId, field.id, response);
        
        // Update extraction prompts
        setExtractionPrompts(prev => {
          const workPrompts = prev[workId] || [];
          // Remove old prompt for this field if exists
          const filtered = workPrompts.filter(p => p.field.id !== field.id);
          return {
            ...prev,
            [workId]: [...filtered, { field, response }]
          };
        });
      }
      
      updateExtractionState(workId, { 
        status: 'completed', 
        progress: 100,
        currentField: undefined
      });
      
      return response;
    } catch (error) {
      updateExtractionState(workId, { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Field extraction failed'
      });
      throw error;
    }
  }, [fullTextCache, fetchFullText, extractFields, onFieldExtracted, updateExtractionState]);

  // Retry failed extraction for a work
  const retryExtraction = useCallback(async (
    work: SearchResult,
    fields: CustomField[]
  ) => {
    const workId = work.id;
    const currentRetries = retryCount[workId] || 0;
    
    if (currentRetries >= MAX_RETRIES) {
      updateExtractionState(workId, {
        status: 'error',
        error: `Maximum retries (${MAX_RETRIES}) exceeded`
      });
      return;
    }
    
    // Clear error state and retry
    updateExtractionState(workId, { status: 'idle', progress: 0 });
    await processWork(work, fields, true); // Force refresh on retry
  }, [retryCount, processWork, updateExtractionState]);

  // Cancel extraction for a work
  const cancelExtraction = useCallback((workId: string) => {
    const controller = abortControllers.current[workId];
    if (controller) {
      try {
        controller.abort(new DOMException('User cancelled extraction', 'AbortError'));
      } catch (e) {
        // Ignore abort errors
      }
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
  
  // Get extraction metrics for a work
  const getExtractionMetrics = useCallback((workId: string) => {
    return extractionMetrics[workId];
  }, [extractionMetrics]);

  // Clear all extraction data for all works
  const clearAllExtractionData = useCallback(() => {
    // Cancel all ongoing extractions
    Object.keys(abortControllers.current).forEach(workId => {
      try {
        abortControllers.current[workId]?.abort(new DOMException('Extraction mode changed', 'AbortError'));
      } catch (e) {
        // Ignore abort errors
      }
    });
    abortControllers.current = {};
    
    // Clear all states
    setExtractionStates({});
    setFullTextCache({});
    setExtractionPrompts({});
    setExtractionMetrics({});
    setRetryCount({});
  }, []);

  return {
    processWork,
    extractSingleField,
    retryExtraction,
    cancelExtraction,
    getExtractionState,
    extractionStates,
    getFullTextData,
    getExtractionPrompts,
    getExtractionMetrics,
    retryCount,
    MAX_RETRIES,
    clearAllExtractionData
  };
}; 