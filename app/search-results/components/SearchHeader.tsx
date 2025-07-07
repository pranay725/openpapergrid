import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import DotGrid from "@/components/DotGrid";
import { EditIcon, SparklesIcon } from "lucide-react";

interface SearchHeaderProps {
  initialQuery: string;
  query: string;
  loading: boolean;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({
  initialQuery,
  query,
  loading,
  onQueryChange,
  onSearch
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [summary, setSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(true);
  const [showFullQuery, setShowFullQuery] = useState(false);

  // Generate AI summary of the query
  useEffect(() => {
    const generateSummary = async () => {
      setIsGeneratingSummary(true);
      try {
        const response = await fetch('/api/summarize-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: initialQuery })
        });
        
        if (response.ok) {
          const data = await response.json();
          setSummary(data.summary);
        } else {
          // Fallback to simple extraction
          const keywords = initialQuery
            .replace(/[()]/g, ' ')
            .replace(/\b(AND|OR|NOT)\b/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3 && !word.startsWith('"'))
            .slice(0, 3)
            .join(' ');
          setSummary(keywords || 'Search Results');
        }
      } catch {
        setSummary('Search Results');
      }
      setIsGeneratingSummary(false);
    };

    generateSummary();
  }, [initialQuery]);

  // Auto-resize textarea
  useEffect(() => {
    if (isEditing) {
      const textarea = document.querySelector('textarea[placeholder*="CRISPR"]') as HTMLTextAreaElement;
      if (textarea) {
        textarea.style.height = 'auto';
        const newHeight = Math.max(48, Math.min(textarea.scrollHeight, 120));
        textarea.style.height = newHeight + 'px';
      }
    }
  }, [query, isEditing]);

  return (
    <section className="relative bg-gradient-to-b from-blue-600 to-blue-700 text-white py-4 flex-shrink-0 overflow-hidden">
      {/* Dot Grid Background */}
      <div className="absolute inset-0 opacity-30">
        <DotGrid
          dotSize={4}
          gap={20}
          baseColor="#ffffff20"
          activeColor="#ffffff"
          proximity={100}
          shockRadius={200}
          shockStrength={5}
          resistance={750}
          returnDuration={1.2}
          className="p-0"
        />
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-8">
        {!isEditing ? (
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                {isGeneratingSummary ? (
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4 animate-pulse" />
                    <span className="text-lg">Analyzing query...</span>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-medium">{summary}</h1>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 hover:bg-white/20 rounded transition-colors"
                      title="Edit search query"
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
              <div className="mt-1">
                {showFullQuery ? (
                  <div className="space-y-1">
                    <p className="text-sm text-blue-100 opacity-90 break-words">
                      {initialQuery}
                    </p>
                    <button
                      onClick={() => setShowFullQuery(false)}
                      className="text-xs text-blue-200 hover:text-white hover:underline"
                    >
                      View less
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-blue-100 opacity-80 truncate max-w-md">
                      {initialQuery}
                    </p>
                    {initialQuery.length > 50 && (
                      <button
                        onClick={() => setShowFullQuery(true)}
                        className="text-xs text-blue-200 hover:text-white hover:underline whitespace-nowrap"
                      >
                        View more
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-blue-100">Edit your search:</p>
            <div className="bg-white rounded shadow-lg">
              <div className="flex items-stretch">
                <textarea
                  placeholder='e.g. (CRISPR OR "base editing") AND sickle-cell'
                  className="flex-1 border-0 text-gray-900 text-sm px-4 py-3 rounded-l focus:ring-0 focus:outline-none resize-none min-h-[48px] max-h-[120px]"
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onSearch();
                      setIsEditing(false);
                    }
                  }}
                  autoFocus
                  rows={1}
                  style={{
                    lineHeight: '1.5',
                    overflow: 'auto'
                  }}
                />
                <button
                  className={`px-6 ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white font-normal transition-colors min-h-[48px]`}
                  onClick={() => {
                    onSearch();
                    setIsEditing(false);
                  }}
                  disabled={loading}
                >
                  {loading ? 'Searching...' : 'Search →'}
                </button>
                <button
                  className="px-4 bg-gray-500 hover:bg-gray-600 text-white font-normal rounded-r transition-colors"
                  onClick={() => {
                    onQueryChange(initialQuery);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}; 