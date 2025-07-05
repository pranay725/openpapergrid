import React from 'react';
import { CustomField } from '@/lib/database.types';
import { SearchResult, PaperStatus, AIResponse, ExtractionMetrics } from '../../types';
import { AIResponseCell } from './AIResponseCell';
import { StatusIndicator } from './StatusIndicator';
import { ExtractionStatus } from '../../hooks/useFullTextExtraction';
import { FileText, ExternalLink } from 'lucide-react';

interface TableRowProps {
  result: SearchResult;
  index: number;
  currentPage: number;
  customFields: CustomField[];
  status: PaperStatus;
  aiResponses: Record<string, AIResponse>;
  extractionStatus?: ExtractionStatus;
  extractionProgress?: number;
  currentField?: string;
  metrics?: ExtractionMetrics;
  onFieldValueChange?: (resultId: string, fieldId: string, value: any) => void;
  onViewFullText?: (result: SearchResult) => void;
}

export const TableRow: React.FC<TableRowProps> = ({
  result,
  index,
  currentPage,
  customFields,
  status,
  aiResponses,
  extractionStatus,
  extractionProgress,
  currentField,
  metrics,
  onFieldValueChange,
  onViewFullText
}) => {
  // Debug logging for first row
  if (index === 0 && metrics) {
    console.log('TableRow Debug:', {
      resultId: result.id,
      status,
      hasMetrics: !!metrics,
      metricsData: metrics
    });
  }
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      {/* Fixed columns */}
      <td className="sticky left-0 z-10 bg-white p-3 border-r border-gray-200">
        <input type="checkbox" className="rounded border-gray-300" />
      </td>
      <td className="sticky left-[44px] z-10 bg-white p-3 text-sm text-gray-500 border-r border-gray-200">
        {(currentPage - 1) * 10 + index + 1}
      </td>
      <td className="sticky left-[92px] z-10 bg-white p-3 min-w-[400px] border-r border-gray-200">
        <div className="space-y-1">
          <div className="flex items-start gap-2">
            <a 
              href={result.doi ? `https://doi.org/${result.doi.replace('https://doi.org/', '')}` : '#'}
              target={result.doi ? '_blank' : undefined}
              rel={result.doi ? 'noopener noreferrer' : undefined}
              className="text-sm font-medium text-blue-700 hover:underline block flex-1"
            >
              {result.title}
            </a>
            <div className="flex items-center gap-1 flex-shrink-0">
              {result.doi && (
                <a
                  href={`https://doi.org/${result.doi.replace('https://doi.org/', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-blue-600 transition-colors"
                  title="View DOI"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              {result.primary_location?.pdf_url && (
                <a
                  href={result.primary_location.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:text-orange-700 transition-colors"
                  title="View PDF"
                >
                  <FileText className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-600">
            {result.authorships?.slice(0, 3).map((auth) => auth.author.display_name).join(', ')}
            {result.authorships && result.authorships.length > 3 && ', et al.'}
          </div>
          <div className="text-xs text-gray-500">
            {result.primary_location?.source?.display_name || 'Unknown source'} • {result.publication_year}
            {result.open_access?.is_oa && (
              <span className="ml-2 text-orange-600 font-medium">Open Access</span>
            )}
          </div>
        </div>
      </td>
      <td className="sticky left-[492px] z-10 bg-white p-3 w-32 border-r border-gray-200 overflow-visible">
        <StatusIndicator 
          status={status} 
          extractionStatus={extractionStatus}
          extractionProgress={extractionProgress}
          currentField={currentField}
          hasFullText={extractionStatus === 'completed' || extractionStatus === 'extracting'}
          onViewFullText={() => onViewFullText?.(result)}
          metrics={metrics}
        />
      </td>
      
      {/* Scrollable AI columns */}
      {customFields.filter(f => f.enabled).map(field => {
        const responseKey = `${result.id}_${field.id}`;
        const isExtractingThisField = extractionStatus === 'extracting' && currentField === field.name;
        
        return (
          <td key={field.id} className="p-3 border-r border-gray-100 last:border-r-0">
            <AIResponseCell 
              field={field} 
              result={result}
              aiResponse={aiResponses[responseKey]}
              isExtracting={isExtractingThisField}
              onValueChange={(value) => onFieldValueChange?.(result.id, field.id, value)}
            />
          </td>
        );
      })}
    </tr>
  );
}; 