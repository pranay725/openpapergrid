import React, { useState } from 'react';
import { SparklesIcon, XIcon, FileTextIcon, BookOpenIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AIProviderSelector } from './AIProviderSelector';

export type ExtractionMode = 'abstract' | 'fulltext';

interface ExtractionControlsProps {
  extractionMode: ExtractionMode;
  onModeChange: (mode: ExtractionMode) => void;
  selectedProvider: string;
  selectedModel: string;
  onProviderChange: (provider: string, model: string) => void;
  isExtracting: boolean;
  hasExtracted: boolean;
  onExtract: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

export const ExtractionControls: React.FC<ExtractionControlsProps> = ({
  extractionMode,
  onModeChange,
  selectedProvider,
  selectedModel,
  onProviderChange,
  isExtracting,
  hasExtracted,
  onExtract,
  onCancel,
  disabled = false
}) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex flex-col gap-3">
        {/* Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Extraction Mode:</span>
          <div className="flex bg-white border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => onModeChange('abstract')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors ${
                extractionMode === 'abstract'
                  ? 'bg-blue-50 text-blue-700 border-r border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 border-r border-gray-300'
              }`}
            >
              <FileTextIcon className="h-4 w-4" />
              Abstract Only
            </button>
            <button
              onClick={() => onModeChange('fulltext')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors ${
                extractionMode === 'fulltext'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <BookOpenIcon className="h-4 w-4" />
              Full Text
            </button>
          </div>
        </div>

        {/* AI Provider and Extract Button */}
        <div className="flex items-center gap-3">
          <AIProviderSelector
            selectedProvider={selectedProvider}
            selectedModel={selectedModel}
            onProviderChange={onProviderChange}
          />
          
          {/* Extract Button */}
          {isExtracting ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              className="gap-2"
            >
              <XIcon className="h-4 w-4" />
              Cancel Extraction
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onExtract}
              disabled={disabled}
              className={`gap-2 ${
                hasExtracted 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              <SparklesIcon className="h-4 w-4" />
              {hasExtracted ? 'Re-extract' : 'Extract'} with AI
            </Button>
          )}
        </div>

        {/* Mode Description */}
        <div className="text-xs text-gray-500">
          {extractionMode === 'abstract' ? (
            <p>Extract information using only the paper abstracts (faster, works for all papers)</p>
          ) : (
            <p>Extract information using full paper text when available (more accurate, requires PDF/full text access)</p>
          )}
        </div>
      </div>
    </div>
  );
}; 