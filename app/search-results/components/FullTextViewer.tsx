import React, { useState } from 'react';
import { X, FileText, Brain, Code, ChevronDown, ChevronRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomField } from '@/lib/database.types';
import { SearchResult } from '../types';
import { ExtractionState } from '../hooks/useFullTextExtraction';
import { useChat } from 'ai/react';

interface FullTextViewerProps {
  result: SearchResult;
  fullText?: string;
  sections?: Record<string, string>;
  extractionPrompts?: Array<{
    field: CustomField;
    prompt: string;
    response?: any;
  }>;
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
  extractionState,
  provider,
  model,
  onFetchFullText,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'fulltext' | 'sections' | 'prompts' | 'chat'>('info');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedPrompts, setExpandedPrompts] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const togglePrompt = (fieldId: string) => {
    setExpandedPrompts(prev => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages
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
    <div className="fixed inset-y-0 right-0 w-1/2 bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex-1 pr-4">
          <h2 className="text-lg font-semibold truncate">{result.title}</h2>
          <p className="text-sm text-gray-500">Publication Details</p>
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

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'info'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="h-4 w-4" />
          Info
        </button>
        <button
          onClick={() => setActiveTab('fulltext')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'fulltext'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="h-4 w-4" />
          Full Text
        </button>
        <button
          onClick={() => setActiveTab('sections')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'sections' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="h-4 w-4" />
          Sections
        </button>
        <button
          onClick={() => setActiveTab('prompts')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'prompts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Brain className="h-4 w-4" />
          AI Prompts
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'chat'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          Chat
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'info' && (
          <div className="space-y-4">
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
        {activeTab === 'fulltext' && (
          <div className="prose prose-sm max-w-none">
            {fullText ? (
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                {fullText}
              </pre>
            ) : (
              <p className="text-gray-500 italic">Full text not available</p>
            )}
          </div>
        )}

        {activeTab === 'sections' && (
          <div className="space-y-3">
            {sections && Object.keys(sections).length > 0 ? (
              Object.entries(sections).map(([sectionName, content]) => (
                <div key={sectionName} className="border rounded-lg">
                  <button
                    onClick={() => toggleSection(sectionName)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                  >
                    <span className="font-medium capitalize">{sectionName}</span>
                    {expandedSections[sectionName] ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                  {expandedSections[sectionName] && (
                    <div className="p-3 pt-0">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700">
                        {content}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No sections extracted</p>
            )}
          </div>
        )}

        {activeTab === 'prompts' && (
          <div className="space-y-4">
            {extractionPrompts && extractionPrompts.length > 0 ? (
              extractionPrompts.map((item) => (
                <div key={item.field.id} className="border rounded-lg">
                  <button
                    onClick={() => togglePrompt(item.field.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.field.name}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {item.field.type}
                      </span>
                    </div>
                    {expandedPrompts[item.field.id] ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                  {expandedPrompts[item.field.id] && (
                    <div className="p-3 pt-0 space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Prompt:</h4>
                        <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded border">
                          {item.prompt}
                        </pre>
                      </div>
                      {item.response && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Response:</h4>
                          <pre className="whitespace-pre-wrap text-xs bg-green-50 p-3 rounded border border-green-200">
                            {JSON.stringify(item.response, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No extraction prompts available</p>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            {!fullText ? (
              <div className="p-3 space-y-2">
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
  );
};
