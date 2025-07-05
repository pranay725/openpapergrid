import React from 'react';
import { CustomField } from '@/lib/database.types';
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
  onFieldEdit?: (field: CustomField) => void;
  onFieldValueChange?: (resultId: string, fieldId: string, value: any) => void;
  onViewFullText?: (result: SearchResult) => void;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  results,
  customFields,
  currentPage,
  aiResponses,
  extractionStates = {},
  extractionMetrics = {},
  onFieldEdit,
  onFieldValueChange,
  onViewFullText
}) => {
  return (
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
                onFieldValueChange={onFieldValueChange}
                onViewFullText={onViewFullText}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}; 