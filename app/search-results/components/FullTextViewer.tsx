import React, { useState } from 'react';
import { X, FileText, Brain, Code, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomField } from '@/lib/database.types';

interface FullTextViewerProps {
  workId: string;
  title: string;
  fullText?: string;
  sections?: Record<string, string>;
  extractionPrompts?: Array<{
    field: CustomField;
    prompt: string;
    response?: any;
  }>;
  onClose: () => void;
}

export const FullTextViewer: React.FC<FullTextViewerProps> = ({
  workId,
  title,
  fullText,
  sections,
  extractionPrompts,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'fulltext' | 'sections' | 'prompts'>('fulltext');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedPrompts, setExpandedPrompts] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const togglePrompt = (fieldId: string) => {
    setExpandedPrompts(prev => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  return (
    <div className="fixed inset-y-0 right-0 w-1/2 bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex-1 pr-4">
          <h2 className="text-lg font-semibold truncate">{title}</h2>
          <p className="text-sm text-gray-500">Full Text & Extraction Details</p>
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
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
      </div>
    </div>
  );
}; 