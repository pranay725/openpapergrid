import React from 'react';
import { FileText } from 'lucide-react';
import { PaperStatus } from '../../types';
import { ExtractionStatus } from '../../hooks/useFullTextExtraction';

interface StatusIndicatorProps {
  status?: PaperStatus;
  extractionStatus?: ExtractionStatus;
  extractionProgress?: number;
  currentField?: string;
  hasFullText?: boolean;
  onViewFullText?: () => void;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status,
  extractionStatus,
  extractionProgress = 0,
  currentField,
  hasFullText = false,
  onViewFullText
}) => {
  // If extraction is in progress, show extraction status
  if (extractionStatus && extractionStatus !== 'idle') {
    const getExtractionColor = () => {
      switch (extractionStatus) {
        case 'fetching':
          return 'bg-yellow-500';
        case 'extracting':
          return 'bg-blue-500';
        case 'completed':
          return 'bg-green-600';
        case 'error':
          return 'bg-red-500';
        default:
          return 'bg-gray-400';
      }
    };

    const getExtractionText = () => {
      switch (extractionStatus) {
        case 'fetching':
          return 'Fetching full text...';
        case 'extracting':
          return currentField ? `Extracting: ${currentField}` : 'Extracting fields...';
        case 'completed':
          return 'Extraction complete';
        case 'error':
          return 'Extraction failed';
        default:
          return '';
      }
    };

    return (
      <div className="flex items-center justify-center gap-2">
        {hasFullText && onViewFullText && (
          <button
            onClick={onViewFullText}
            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="View full text and prompts"
          >
            <FileText className="h-4 w-4" />
          </button>
        )}
        <div className="relative group">
          {extractionStatus === 'extracting' || extractionStatus === 'fetching' ? (
            <div className="relative w-8 h-8">
              <svg className="w-8 h-8 transform -rotate-90">
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  className="text-gray-300"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 14}`}
                  strokeDashoffset={`${2 * Math.PI * 14 * (1 - extractionProgress / 100)}`}
                  className={`${getExtractionColor()} transition-all duration-300`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium">{Math.round(extractionProgress)}%</span>
              </div>
            </div>
          ) : (
            <div className={`w-3 h-3 rounded-full ${getExtractionColor()}`}></div>
          )}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {getExtractionText()}
          </div>
        </div>
      </div>
    );
  }
  
  // Otherwise show regular status
  if (!status) {
    return null;
  }
  
  const getStatusColor = () => {
    switch (status.type) {
      case 'ingesting':
      case 'extracting':
        return 'bg-blue-500 animate-pulse';
      case 'done-full':
        return 'bg-green-600';
      case 'done-abstract':
        return 'bg-green-400';
      case 'pending':
      default:
        return 'bg-gray-400';
    }
  };
  
  return (
    <div className="flex items-center justify-center gap-2">
      {hasFullText && onViewFullText && (
        <button
          onClick={onViewFullText}
          className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="View full text and prompts"
        >
          <FileText className="h-4 w-4" />
        </button>
      )}
      <div className="relative group">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {status.text}
        </div>
      </div>
    </div>
  );
}; 