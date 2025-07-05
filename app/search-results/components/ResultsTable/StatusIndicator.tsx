import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { PaperStatus, ExtractionMetrics } from '../../types';
import { ExtractionStatus } from '../../hooks/useFullTextExtraction';
import { ExtractionMetricsCard } from './ExtractionMetricsCard';

interface StatusIndicatorProps {
  status?: PaperStatus;
  extractionStatus?: ExtractionStatus;
  extractionProgress?: number;
  currentField?: string;
  hasFullText?: boolean;
  onViewFullText?: () => void;
  metrics?: ExtractionMetrics;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status,
  extractionStatus,
  extractionProgress = 0,
  currentField,
  hasFullText = false,
  onViewFullText,
  metrics
}) => {
  const [showMetrics, setShowMetrics] = useState(false);
  const [cardPosition, setCardPosition] = useState<{ top: number; left: number } | null>(null);
  const indicatorRef = React.useRef<HTMLDivElement>(null);
  
  // Generate a stable ID for this component instance
  const gradientId = React.useMemo(() => `gradient-${Math.random().toString(36).substr(2, 9)}`, []);
  
  // Debug logging
  if (metrics) {
    console.log('StatusIndicator Debug:', {
      status,
      extractionStatus,
      hasMetrics: !!metrics,
      showMetrics
    });
  }
  // If extraction is in progress (but not completed with metrics), show extraction status
  if (extractionStatus && extractionStatus !== 'idle' && !(extractionStatus === 'completed' && metrics && status?.type !== 'pending')) {
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
            <div className="relative w-6 h-6 flex items-center justify-center">
              {/* Progress circle */}
              <svg className="w-6 h-6 transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-gray-200"
                />
                {/* Progress circle with gradient */}
                <defs>
                  <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke={`url(#${gradientId})`}
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 10}`}
                  strokeDashoffset={`${2 * Math.PI * 10 * (1 - extractionProgress / 100)}`}
                  className="transition-all duration-500 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              
              {/* Center dot for fetching */}
              {extractionStatus === 'fetching' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <div className={`w-3 h-3 rounded-full ${getExtractionColor()} transition-all duration-300`}></div>
              {extractionStatus === 'completed' && (
                <>
                  {/* Success animation ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping"></div>
                  <div className="absolute inset-0 rounded-full border border-green-300 animate-ping animation-delay-200"></div>
                </>
              )}
            </div>
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
      <div 
        ref={indicatorRef}
        className="relative group"
        onMouseEnter={() => {
          if (metrics && indicatorRef.current) {
            const rect = indicatorRef.current.getBoundingClientRect();
            setCardPosition({
              top: rect.top - 8, // 8px above the indicator
              left: rect.left + rect.width / 2
            });
            setShowMetrics(true);
          }
        }}
        onMouseLeave={() => {
          setShowMetrics(false);
          setCardPosition(null);
        }}
      >
        <div className={`w-3 h-3 rounded-full ${getStatusColor()} ${metrics ? 'cursor-help ring-2 ring-blue-400 ring-offset-1' : ''}`}></div>
        {!showMetrics && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {status.text}
          </div>
        )}
        {showMetrics && metrics && cardPosition && (status.type === 'done-full' || status.type === 'done-abstract') && (
          <ExtractionMetricsCard metrics={metrics} status={status.type} position={cardPosition} />
        )}
      </div>
    </div>
  );
}; 