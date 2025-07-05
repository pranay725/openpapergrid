import React from 'react';
import ReactDOM from 'react-dom';
import { ExtractionMetrics } from '../../types';
import { Clock, Database, Cpu, DollarSign, FileText, Globe } from 'lucide-react';

interface ExtractionMetricsCardProps {
  metrics: ExtractionMetrics;
  status: 'done-full' | 'done-abstract';
  position?: { top: number; left: number };
}

// Model pricing in $ per 1M tokens (approximate)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'openrouter/cypher-alpha:free': { input: 0, output: 0 },
  'google/gemma-3n-e4b-it:free': { input: 0, output: 0 },
  'google/gemini-2.5-flash-preview-05-20': { input: 0.075, output: 0.30 },
  'openai/gpt-4.1': { input: 5.0, output: 15.0 },
  'openai/gpt-3.5-turbo': { input: 0.5, output: 1.5 },
};

export const ExtractionMetricsCard: React.FC<ExtractionMetricsCardProps> = ({ metrics, status, position }) => {
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} chars`;
    return `${(bytes / 1024).toFixed(1)}k chars`;
  };

  const calculateCost = () => {
    if (!metrics.totalTokens) return null;
    
    const pricing = MODEL_PRICING[metrics.model] || { input: 0, output: 0 };
    const inputCost = (metrics.promptTokens || 0) * pricing.input / 1_000_000;
    const outputCost = (metrics.completionTokens || 0) * pricing.output / 1_000_000;
    const totalCost = inputCost + outputCost;
    
    return {
      input: inputCost,
      output: outputCost,
      total: totalCost
    };
  };

  const cost = calculateCost();

  const cardContent = (
    <div 
      className="fixed w-80 p-4 bg-white rounded-lg shadow-2xl border border-gray-200 text-sm z-[9999]" 
      style={{ 
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        top: position?.top || 0,
        left: position?.left || 0,
        transform: 'translateX(-50%)'
      }}
    >
      <h3 className="font-semibold text-gray-900 mb-3">Extraction Details</h3>
      
      {/* Source Information */}
      <div className="mb-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 text-gray-600 mb-1">
          <Database className="h-4 w-4" />
          <span className="font-medium">Data Source</span>
        </div>
        <div className="ml-6 space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Type:</span>
            <span className="font-mono text-xs">
              {metrics.abstractSource === 'openalex' && 'OpenAlex Abstract'}
              {metrics.abstractSource === 'openalex_inverted' && 'OpenAlex (Inverted Index)'}
              {metrics.abstractSource === 'scraped' && 'Web Scraped'}
              {metrics.abstractSource === 'fulltext' && (
                metrics.fullTextSource === 'pmc' ? 'PMC Full Text' :
                metrics.fullTextSource === 'pdf' ? 'PDF (LlamaParse)' :
                metrics.fullTextSource === 'firecrawl' ? 'Web Scraped Full Text' :
                'Full Text'
              )}
            </span>
          </div>
          {metrics.abstractLength && (
            <div className="flex justify-between">
              <span className="text-gray-500">Abstract:</span>
              <span className="font-mono text-xs">{formatBytes(metrics.abstractLength)}</span>
            </div>
          )}
          {metrics.fullTextLength && (
            <div className="flex justify-between">
              <span className="text-gray-500">Full Text:</span>
              <span className="font-mono text-xs">{formatBytes(metrics.fullTextLength)}</span>
            </div>
          )}
          {metrics.scrapedFrom && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Scraped from:</span>
              <a 
                href={metrics.scrapedFrom} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                <Globe className="h-3 w-3" />
                <span className="text-xs truncate max-w-[150px]">{new URL(metrics.scrapedFrom).hostname}</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Timing Information */}
      <div className="mb-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 text-gray-600 mb-1">
          <Clock className="h-4 w-4" />
          <span className="font-medium">Performance</span>
        </div>
        <div className="ml-6 space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Total Duration:</span>
            <span className="font-mono text-xs">{formatDuration(metrics.duration)}</span>
          </div>
          {metrics.scrapingDuration && (
            <div className="flex justify-between">
              <span className="text-gray-500">Scraping Time:</span>
              <span className="font-mono text-xs">{formatDuration(metrics.scrapingDuration)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">AI Processing:</span>
            <span className="font-mono text-xs">
              {formatDuration(metrics.duration - (metrics.scrapingDuration || 0))}
            </span>
          </div>
        </div>
      </div>

      {/* AI Processing Details */}
      <div className="mb-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 text-gray-600 mb-1">
          <Cpu className="h-4 w-4" />
          <span className="font-medium">AI Processing</span>
        </div>
        <div className="ml-6 space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Model:</span>
            <span className="font-mono text-xs truncate max-w-[180px]">{metrics.model.split('/').pop()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Provider:</span>
            <span className="font-mono text-xs">{metrics.provider}</span>
          </div>
          {metrics.chunksProcessed && (
            <div className="flex justify-between">
              <span className="text-gray-500">Chunks:</span>
              <span className="font-mono text-xs">{metrics.chunksProcessed} / {metrics.totalChunks}</span>
            </div>
          )}
        </div>
      </div>

      {/* Token Usage */}
      {metrics.totalTokens && (
        <div className="mb-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <FileText className="h-4 w-4" />
            <span className="font-medium">Token Usage</span>
          </div>
          <div className="ml-6 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Input Tokens:</span>
              <span className="font-mono text-xs">{metrics.promptTokens?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Output Tokens:</span>
              <span className="font-mono text-xs">{metrics.completionTokens?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-gray-600">Total:</span>
              <span className="font-mono text-xs">{metrics.totalTokens.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Cost Estimation */}
      {cost && cost.total > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="font-medium">Cost Estimate</span>
          </div>
          <div className="ml-6 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Input Cost:</span>
              <span className="font-mono text-xs">${cost.input.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Output Cost:</span>
              <span className="font-mono text-xs">${cost.output.toFixed(4)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-gray-600">Total Cost:</span>
              <span className="font-mono text-xs text-green-600">${cost.total.toFixed(4)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Field Confidence Summary */}
      {metrics.fieldMetrics && Object.keys(metrics.fieldMetrics).length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <span className="font-medium">Field Confidence</span>
          </div>
          <div className="ml-6 space-y-1">
            {Object.entries(metrics.fieldMetrics).map(([fieldId, fieldData]) => (
              <div key={fieldId} className="flex justify-between">
                <span className="text-gray-500 text-xs">{fieldId}:</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${fieldData.confidence * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs">{(fieldData.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Use portal to render outside of table structure
  if (typeof window !== 'undefined') {
    return ReactDOM.createPortal(cardContent, document.body);
  }

  return null;
}; 