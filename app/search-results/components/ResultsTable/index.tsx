import React from 'react';
import { CustomField } from '@/lib/database.types';
import { SearchResult, AIResponse, PaperStatus } from '../../types';
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
  onFieldEdit,
  onFieldValueChange,
  onViewFullText
}) => {
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full border-collapse">
        <TableHeader 
          customFields={customFields} 
          onFieldEdit={onFieldEdit}
        />
        <tbody>
          {results.map((result, index) => {
            // Generate mock status for each paper
            const status = generateMockStatus();
            const extractionState = extractionStates[result.id];
            
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