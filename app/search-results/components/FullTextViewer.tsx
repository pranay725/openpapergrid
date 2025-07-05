import React, { useState } from 'react';
import { X, FileText, Brain, CheckCircle, AlertCircle, Loader2, BarChart3, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomField } from '@/lib/database.types';
import { SearchResult, ExtractionMetrics } from '../types';
import { ExtractionState } from '../hooks/useFullTextExtraction';
import { useChat } from 'ai/react';

interface FullTextViewerProps {
  result: SearchResult;
  fullText?: string;
  sections?: Record<string, string>;
  extractionPrompts?: Array<{
    field: CustomField;
    response?: any;
  }>;
  metrics?: ExtractionMetrics;
  extractionState?: ExtractionState;
  provider: string;
  model: string;
  onFetchFullText?: () => void;
  onClose: () => void;
}

export const FullTextViewer: React.FC<FullTextViewerProps> = ({
  result,
  fullText,
  sections,
  extractionPrompts,
  metrics,
  extractionState,
  provider,
  model,
  onFetchFullText,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'source' | 'extractions' | 'confidence' | 'chat'>('info');
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({});
  const [confidenceScores, setConfidenceScores] = useState<Record<string, number>>({});
  const [confidenceAnalysis, setConfidenceAnalysis] = useState<any>(null);
  const [scoringInProgress, setScoringInProgress] = useState(false);
  const [expandedAnalysis, setExpandedAnalysis] = useState<Record<string, boolean>>({});

  const toggleField = (fieldId: string) => {
    setExpandedFields(prev => ({ ...prev, [fieldId]: !prev[fieldId] }));
  const toggleField = (fieldId: string) => {
    setExpandedFields(prev => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  const isAbstractMode = metrics?.abstractSource !== 'fulltext';
  const sourceText = isAbstractMode 
    ? sections?.abstract || fullText?.substring(0, 1000) || ''
    : fullText || '';

  const getSourceLabel = () => {
    if (!metrics) return 'Unknown Source';
    switch (metrics.abstractSource) {
      case 'openalex': return 'OpenAlex Abstract';
      case 'openalex_inverted': return 'OpenAlex Abstract (Reconstructed)';
      case 'scraped': return 'Web-Scraped Abstract';
      case 'fulltext': 
        if (metrics.fullTextSource === 'pmc') return 'PMC Full Text';
        if (metrics.fullTextSource === 'pdf') return 'PDF (LlamaParse)';
        if (metrics.fullTextSource === 'firecrawl') return 'Web-Scraped Full Text';
        return 'Full Text';
      default: return 'Unknown Source';
    }
  };

  const runConfidenceScoring = async () => {
    if (!extractionPrompts || extractionPrompts.length === 0) return;
    
    setScoringInProgress(true);
    
    try {
      const sourceTextForAnalysis = isAbstractMode
        ? `Title: ${result.title}\n\nAbstract: ${sourceText}`
        : sourceText;
      
      const extractedFields = extractionPrompts.map(prompt => ({
        fieldId: prompt.field.id,
        name: prompt.field.name,
        type: prompt.field.type,
        value: prompt.response?.value,
        confidence: prompt.response?.confidence,
        citations: prompt.response?.citations
      }));
      
      const response = await fetch('/api/ai/confidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText: sourceTextForAnalysis,
          extractedFields,
          provider: 'openrouter',
          model: 'openrouter/cypher-alpha:free'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze confidence');
      }
      
      const data = await response.json();
      const { analysis } = data;
      
      const scores: Record<string, number> = {};
      analysis.fieldScores.forEach((score: any) => {
        scores[score.fieldId] = score.confidence;
      });
      
      setConfidenceScores(scores);
      setConfidenceAnalysis(analysis);
      
    } catch (error) {
      console.error('Confidence scoring error:', error);
    } finally {
      setScoringInProgress(false);
    }
  };

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  } = useChat({
    api: '/api/ai/chat',
    body: {
      workId: result.id,
      fullText,
      provider,
      model
    }
  });

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 right-0 w-2/3 bg-white shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex-1 pr-4">
          <h2 className="text-lg font-semibold truncate">{result.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-600">Extraction Source:</span>
            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {getSourceLabel()}
            </span>
            {metrics?.scrapedFrom && (
              <a 
                href={metrics.scrapedFrom} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-blue-600"
              >
                (view source)
              </a>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="ml-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex border-b bg-white">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'info' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="h-4 w-4" />
          Info
        </button>
        <button
          onClick={() => setActiveTab('source')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'source' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="h-4 w-4" />
          {isAbstractMode ? 'Abstract Used' : 'Full Text'}
        </button>
        <button
          onClick={() => setActiveTab('extractions')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'extractions' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Brain className="h-4 w-4" />
          Extracted Fields
          {extractionPrompts && extractionPrompts.length > 0 && (
            <span className="ml-1 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
              {extractionPrompts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('confidence')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'confidence' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Confidence Analysis
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'chat'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'info' && (
          <div className="p-6 space-y-4">
            <div className="text-sm text-gray-700">
              <span className="font-medium">Authors:</span>{' '}
              {result.authorships?.map(a => a.author.display_name).join(', ') || 'N/A'}
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-medium">Journal:</span>{' '}
              {result.primary_location?.source?.display_name || 'Unknown'} ({result.publication_year})
            </div>
            {(sections?.abstract || result.abstract) && (
              <div>
                <h3 className="text-sm font-medium mb-1">Abstract</h3>
                <pre className="whitespace-pre-wrap text-sm text-gray-700">{sections?.abstract || result.abstract}</pre>
              </div>
            )}
          </div>
        )}
        {activeTab === 'source' && (
          <div className="p-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                {isAbstractMode ? 'Abstract' : 'Full Text'}
              </h3>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {sourceText || 'No text available'}
                </pre>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'extractions' && (
           <div className="p-6">
           {extractionPrompts && extractionPrompts.length > 0 ? (
             <div className="space-y-4">
               {extractionPrompts.map((item) => (
                 <div key={item.field.id} className="border rounded-lg overflow-hidden">
                   <button
                     onClick={() => toggleField(item.field.id)}
                     className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                   >
                     <div className="flex items-center gap-3">
                       <span className="font-medium text-gray-900">{item.field.name}</span>
                       <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                         {item.field.type}
                       </span>
                       {item.response && (
                         <CheckCircle className="h-4 w-4 text-green-600" />
                       )}
                     </div>
                     <div className="flex items-center gap-2">
                       {item.response?.confidence && (
                         <span className="text-sm text-gray-600">
                           {Math.round(item.response.confidence * 100)}% confidence
                         </span>
                       )}
                     </div>
                   </button>
                   
                   {expandedFields[item.field.id] && item.response && (
                     <div className="px-4 pb-4 space-y-3 bg-gray-50">
                       <div>
                         <h4 className="text-sm font-medium text-gray-700 mb-1">Extracted Value:</h4>
                         <div className="bg-white p-3 rounded border">
                           {typeof item.response.value === 'object' 
                             ? <pre className="text-sm">{JSON.stringify(item.response.value, null, 2)}</pre>
                             : <p className="text-sm">{String(item.response.value)}</p>
                           }
                         </div>
                       </div>
                       
                       {item.response.citations && item.response.citations.length > 0 && (
                         <div>
                           <h4 className="text-sm font-medium text-gray-700 mb-1">Supporting Evidence:</h4>
                           <div className="space-y-2">
                             {item.response.citations.map((citation: any, idx: number) => (
                               <div key={idx} className="bg-white p-3 rounded border text-sm">
                                 <p className="text-gray-700 italic">"{citation.text}"</p>
                                 {citation.location && (
                                   <p className="text-xs text-gray-500 mt-1">— {citation.location}</p>
                                 )}
                               </div>
                             ))}
                           </div>
                         </div>
                       )}
                     </div>
                   )}
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-center py-12 text-gray-500">
               <Brain className="h-12 w-12 mx-auto mb-3 text-gray-300" />
               <p>No fields have been extracted yet</p>
             </div>
           )}
         </div>
        )}
        {activeTab === 'confidence' && (
          <div className="p-6">
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Confidence Scoring</h3>
              <p className="text-sm text-blue-700">
                Run an additional AI analysis to verify extraction accuracy by comparing extracted values 
                against the source text and assigning confidence scores based on evidence strength.
              </p>
            </div>

            {!scoringInProgress && Object.keys(confidenceScores).length === 0 && (
              <div className="text-center py-8">
                <Button
                  onClick={runConfidenceScoring}
                  className="mx-auto"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Run Confidence Analysis
                </Button>
              </div>
            )}

            {scoringInProgress && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Analyzing extraction confidence...</span>
              </div>
            )}

            {!scoringInProgress && Object.keys(confidenceScores).length > 0 && (
              <div className="space-y-4">
                {confidenceAnalysis && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Overall Confidence</h4>
                      <span className="text-lg font-semibold text-gray-700">
                        {Math.round(confidenceAnalysis.overallConfidence * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div 
                        className="h-2 rounded-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${confidenceAnalysis.overallConfidence * 100}%` }}
                      />
                    </div>
                    {confidenceAnalysis.recommendations && confidenceAnalysis.recommendations.length > 0 && (
                      <div className="mt-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Recommendations:</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {confidenceAnalysis.recommendations.map((rec: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-gray-400 mt-0.5">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                {extractionPrompts?.map(prompt => {
                  const score = confidenceScores[prompt.field.id] || 0;
                  const fieldAnalysis = confidenceAnalysis?.fieldScores.find((f: any) => f.fieldId === prompt.field.id);
                  const isHighConfidence = score >= 0.8;
                  const isMediumConfidence = score >= 0.6 && score < 0.8;
                  const isExpanded = expandedAnalysis[prompt.field.id];
                  
                  return (
                    <div key={prompt.field.id} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedAnalysis(prev => ({ ...prev, [prompt.field.id]: !prev[prompt.field.id] }))}
                        className="w-full p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-left">{prompt.field.name}</span>
                          <div className="flex items-center gap-2">
                            {isHighConfidence && <CheckCircle className="h-5 w-5 text-green-600" />}
                            {isMediumConfidence && <AlertCircle className="h-5 w-5 text-yellow-600" />}
                            {!isHighConfidence && !isMediumConfidence && <AlertCircle className="h-5 w-5 text-red-600" />}
                            <span className={`font-medium ${
                              isHighConfidence ? 'text-green-600' : 
                              isMediumConfidence ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {Math.round(score * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              isHighConfidence ? 'bg-green-600' : 
                              isMediumConfidence ? 'bg-yellow-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${score * 100}%` }}
                          />
                        </div>
                      </button>
                      
                      {isExpanded && fieldAnalysis && (
                        <div className="px-4 pb-4 bg-gray-50 space-y-3">
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Evidence Strength:</h5>
                            <span className={`text-sm px-2 py-1 rounded ${
                              fieldAnalysis.evidenceStrength === 'strong' ? 'bg-green-100 text-green-700' :
                              fieldAnalysis.evidenceStrength === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                              fieldAnalysis.evidenceStrength === 'weak' ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {fieldAnalysis.evidenceStrength}
                            </span>
                          </div>
                          
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Analysis Reasoning:</h5>
                            <p className="text-sm text-gray-600">{fieldAnalysis.reasoning}</p>
                          </div>
                          
                          {fieldAnalysis.issues && fieldAnalysis.issues.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-1">Potential Issues:</h5>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {fieldAnalysis.issues.map((issue: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                    <span>{issue}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {activeTab === 'chat' && (
          <div className="p-6 flex flex-col h-full">
            {!fullText ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Full text is required for chat.</p>
                <Button onClick={onFetchFullText} disabled={extractionState?.status === 'fetching' || extractionState?.status === 'extracting'}>
                  {extractionState?.status === 'fetching' || extractionState?.status === 'extracting' ? 'Fetching Full Text...' : 'Fetch Full Text'}
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-2 mb-2">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded ${m.role === 'user' ? 'bg-blue-50 text-right' : 'bg-gray-100'}`}
                    >
                      {m.content}
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    value={input}
                    onChange={handleInputChange}
                    className="flex-1 border rounded px-3 py-2 text-sm"
                    placeholder="Ask a question..."
                  />
                  <Button type="submit" disabled={isLoading || !input}>Send</Button>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
    </>
    </>
  );
};
