import React from 'react';
import { CustomField } from '@/lib/database.types';
import { SearchResult, AIResponse, PaperStatus, ExtractionMetrics } from '../../types';
import { SearchResult, AIResponse, PaperStatus, ExtractionMetrics } from '../../types';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';
import { generateMockStatus } from '../../utils/mockDataGenerators';
import { ExtractionStatus } from '../../hooks/useFullTextExtraction';

interface ResultsTableProps {
  results: SearchResult[];
  customFields: CustomField[];
  currentPage: number;
  aiResponses: Record<string, AIResponse>;
  extractionStates?: Record<string, { status: ExtractionStatus; progress: number; currentField?: string }>;
  extractionMetrics?: Record<string, ExtractionMetrics>;
  retryCount?: Record<string, number>;
  maxRetries?: number;
  onFieldEdit?: (field: CustomField) => void;
  onFieldValueChange?: (resultId: string, fieldId: string, value: any) => void;
  onViewFullText?: (result: SearchResult) => void;
  onRetryExtraction?: (result: SearchResult) => void;
  onRefreshExtraction?: (result: SearchResult) => void;
  onExtractSingleField?: (result: SearchResult, field: CustomField) => void;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  results,
  customFields,
  currentPage,
  aiResponses,
  extractionStates = {},
  extractionMetrics = {},
  retryCount = {},
  maxRetries = 3,
  onFieldEdit,
  onFieldValueChange,
  onViewFullText,
  onRetryExtraction,
  onRefreshExtraction,
  onExtractSingleField
}) => {
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg" style={{ position: 'relative' }}>
      <table className="w-full border-collapse relative">
    <div className="overflow-x-auto border border-gray-200 rounded-lg" style={{ position: 'relative' }}>
      <table className="w-full border-collapse relative">
        <TableHeader 
          customFields={customFields} 
          onFieldEdit={onFieldEdit}
        />
        <tbody>
          {results.map((result, index) => {
            const extractionState = extractionStates[result.id];
            const metrics = extractionMetrics[result.id];
            
            // Determine status based on extraction state and metrics
            let status = generateMockStatus();
            if (extractionState?.status === 'completed' && metrics) {
              // Set status based on extraction mode
              status = {
                type: metrics.abstractSource === 'fulltext' ? 'done-full' : 'done-abstract',
                text: metrics.abstractSource === 'fulltext' ? 'Full Text Extracted' : 'Abstract Extracted'
              };
            } else if (extractionState?.status === 'extracting' || extractionState?.status === 'fetching') {
              status = {
                type: 'extracting',
                text: 'Extracting...'
              };
            }
            const metrics = extractionMetrics[result.id];
            
            // Determine status based on extraction state and metrics
            let status = generateMockStatus();
            if (extractionState?.status === 'completed' && metrics) {
              // Set status based on extraction mode
              status = {
                type: metrics.abstractSource === 'fulltext' ? 'done-full' : 'done-abstract',
                text: metrics.abstractSource === 'fulltext' ? 'Full Text Extracted' : 'Abstract Extracted'
              };
            } else if (extractionState?.status === 'extracting' || extractionState?.status === 'fetching') {
              status = {
                type: 'extracting',
                text: 'Extracting...'
              };
            }
            
            return (
              <TableRow
                key={result.id}
                result={result}
                index={index}
                currentPage={currentPage}
                customFields={customFields}
                status={status}
                aiResponses={aiResponses}
                extractionStatus={extractionState?.status}
                extractionProgress={extractionState?.progress}
                currentField={extractionState?.currentField}
                metrics={metrics}
                retryCount={retryCount[result.id]}
                maxRetries={maxRetries}
                onFieldValueChange={onFieldValueChange}
                onViewFullText={onViewFullText}
                onRetryExtraction={onRetryExtraction}
                onRefreshExtraction={onRefreshExtraction}
                onExtractSingleField={onExtractSingleField}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}; 