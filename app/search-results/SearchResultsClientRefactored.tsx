'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Logo } from '@/components/Logo';
import { SearchHeader } from './components/SearchHeader';
import { ResultsTable } from './components/ResultsTable';
import { ConfigurationBar } from './components/ConfigurationManagement/ConfigurationBar';
import { AddFieldDialog } from './components/FieldManagement/AddFieldDialog';
import { HeaderSkeleton, ResultSkeleton } from './components/Skeletons';
import { FilterSidebar } from './components/FilterSidebar';
import { Pagination } from './components/Pagination';
import { useSearchFilters } from './hooks/useSearchFilters';
import { useSearchResults } from './hooks/useSearchResults';
import { useAIResponses } from './hooks/useAIResponses';
import { useFullTextExtraction } from './hooks/useFullTextExtraction';
import { buildFilterUrl } from './utils/filterHelpers';
import type { SearchResultsClientProps, SearchFilters, SearchResult } from './types';
import { CustomField } from '@/lib/database.types';
import { 
  setActiveConfiguration, 
  updateConfiguration
} from '@/lib/screening-config-api';
import { AIProviderSelector } from './components/AIProviderSelector';
import { ExtractButton } from './components/ExtractButton';
import { FullTextViewer } from './components/FullTextViewer';

export default function SearchResultsClientRefactored({ 
  configurations, 
  activeConfig, 
  userId 
}: SearchResultsClientProps) {
  const searchParams = useSearchParams();

  // Parse initial values from URL
  const initialQuery = searchParams.get('query') || '';
  const initialPage = parseInt(searchParams.get('page') || '1');
  const initialSort = searchParams.get('sort') || 'relevance_score:desc';

  // State
  const [query, setQuery] = useState(initialQuery);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [sortBy, setSortBy] = useState(initialSort);
  const [currentConfig, setCurrentConfig] = useState(activeConfig);
  const [customFields, setCustomFields] = useState<CustomField[]>(activeConfig?.fields || []);
  const [selectedConfig, setSelectedConfig] = useState<string>(activeConfig?.id || '');
  const [showAddFieldDialog, setShowAddFieldDialog] = useState(false);
  const [showFieldSettings, setShowFieldSettings] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [aiProvider, setAIProvider] = useState('openrouter');
  const [aiModel, setAIModel] = useState('anthropic/claude-3.5-sonnet');
  const [viewingFullText, setViewingFullText] = useState<SearchResult | null>(null);

  // Custom hooks
  const { filters, pendingFilters, counts, actions } = useSearchFilters({
    year: searchParams.get('year')?.split('|') || [],
    countries: searchParams.get('countries')?.split('|') || [],
    authors: searchParams.get('authors')?.split('|') || [],
    textAvailability: searchParams.get('textAvailability')?.split('|') || [],
    journals: searchParams.get('journals')?.split('|') || [],
    institutions: searchParams.get('institutions')?.split('|') || [],
    topics: searchParams.get('topics')?.split('|') || []
  });

  const { 
    results, 
    totalResults, 
    loading, 
    error,
    yearBreakdown,
    journalBreakdown,
    authorBreakdown,
    institutionBreakdown,
    topicBreakdown,
    countryBreakdown,
    fetchResults 
  } = useSearchResults();

  const { 
    aiResponses, 
    fieldValues, 
    updateFieldValue, 
    updateAIResponse,
    clearResultResponses 
  } = useAIResponses(results || [], customFields);
  
  // Full text extraction hook
  const { 
    processWork, 
    cancelExtraction, 
    getExtractionState, 
    extractionStates,
    getFullTextData,
    getExtractionPrompts
  } = useFullTextExtraction({
    onFieldExtracted: (workId, fieldId, response) => {
      // Update the full AI response
      updateAIResponse(workId, fieldId, response);
    },
    onFieldStreaming: (workId, fieldId, partial) => {
      // Update with partial streaming data
      try {
        const partialValue = JSON.parse(partial);
        updateAIResponse(workId, fieldId, {
          value: partialValue,
          confidence: 0.5, // Show lower confidence while streaming
          citations: [] // Always provide empty array during streaming
        });
      } catch (e) {
        // If not valid JSON, just update with the string
        updateAIResponse(workId, fieldId, {
          value: partial,
          confidence: 0.5,
          citations: [] // Always provide empty array during streaming
        });
      }
    },
    provider: aiProvider,
    model: aiModel
  });

  // Update custom fields when config changes
  useEffect(() => {
    if (currentConfig) {
      setCustomFields(currentConfig.fields.filter(f => f.enabled));
    }
  }, [currentConfig]);
  
  // Track previous query to detect changes
  const [previousQuery, setPreviousQuery] = useState(initialQuery);
  
  // Clear AI responses when search query changes
  useEffect(() => {
    if (query !== previousQuery && results) {
      // Clear all responses when performing a new search
      results.forEach(result => {
        clearResultResponses(result.id);
      });
      setPreviousQuery(query);
    }
  }, [query, previousQuery, results, clearResultResponses]);

  // Initial fetch
  useEffect(() => {
    fetchResults(initialQuery, filters, initialPage, initialSort);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const handleSearch = () => {
    const newQuery = query.trim();
    if (newQuery) {
      setCurrentPage(1);
      const url = buildFilterUrl(newQuery, filters, 1, sortBy);
      window.history.pushState({}, '', url);
      fetchResults(newQuery, filters, 1, sortBy);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const url = buildFilterUrl(query, filters, newPage, sortBy);
    window.history.pushState({}, '', url);
    fetchResults(query, filters, newPage, sortBy);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setCurrentPage(1);
    const url = buildFilterUrl(query, filters, 1, newSort);
    window.history.pushState({}, '', url);
    fetchResults(query, filters, 1, newSort);
  };

  const handleConfigChange = async (configId: string) => {
    if (configId === 'custom') {
      // Handle custom configuration creation
      setShowAddFieldDialog(true);
      return;
    }

    try {
      const newConfig = configurations.find(c => c.id === configId);
      if (!newConfig) return;
      
      setSelectedConfig(configId);
      setCurrentConfig(newConfig);
      await setActiveConfiguration(configId);
    } catch (error) {
      console.error('Error changing configuration:', error);
    }
  };

  const handleAddColumn = () => {
    if (currentConfig?.visibility === 'default') {
      if (confirm('You\'re using a default configuration. Would you like to create a custom configuration based on this one?')) {
        // Create custom config logic
      }
    } else {
      setShowAddFieldDialog(true);
    }
  };

  const handleAddField = (field: CustomField) => {
    setCustomFields([...customFields, field]);
  };

  const handleSaveConfig = async () => {
    if (!currentConfig || currentConfig.visibility !== 'private') return;
    
    try {
      await updateConfiguration(currentConfig.id, { fields: customFields });
      alert('Configuration saved successfully!');
    } catch {
      alert('Failed to save configuration');
    }
  };

  const handleExtractAll = () => {
    if (!results) return;
    
    // Process all visible results
    results.forEach(result => {
      const state = getExtractionState(result.id);
      if (state.status === 'idle') {
        processWork(result, customFields);
      }
    });
  };

  const totalPages = Math.ceil(totalResults / 10);

  return (
    <main className="min-h-screen w-full bg-white text-gray-900 font-sans flex flex-col">
      <Header />
      
      <SearchHeader
        initialQuery={initialQuery}
        query={query}
        loading={loading}
        onQueryChange={setQuery}
        onSearch={handleSearch}
      />

      <section className="w-full flex-1 flex overflow-hidden">
        <FilterSidebar
          filters={{
            selectedYear: filters.year,
            selectedJournal: filters.journals,
            selectedAuthor: filters.authors,
            selectedInstitution: filters.institutions,
            selectedConcept: filters.topics,
            selectedCountry: filters.countries,
            textAvailability: filters.textAvailability,
            dateRange: filters.dateRange
          }}
          pendingFilters={{
            pendingYear: pendingFilters.year,
            pendingJournal: pendingFilters.journals,
            pendingAuthor: pendingFilters.authors,
            pendingInstitution: pendingFilters.institutions,
            pendingConcept: pendingFilters.topics,
            pendingCountry: pendingFilters.countries,
            pendingTextAvailability: pendingFilters.textAvailability,
            pendingDateRange: pendingFilters.dateRange
          }}
          breakdowns={{
            yearBreakdown,
            journalBreakdown,
            authorBreakdown,
            institutionBreakdown,
            conceptBreakdown: topicBreakdown,
            countryBreakdown
          }}
          results={results}
          onFilterChange={(filterType, values) => {
            // Map the pending filter names to the actual filter keys
            const filterMap: Record<string, keyof SearchFilters> = {
              pendingYear: 'year',
              pendingJournal: 'journals',
              pendingAuthor: 'authors',
              pendingInstitution: 'institutions',
              pendingConcept: 'topics',
              pendingCountry: 'countries',
              pendingTextAvailability: 'textAvailability',
              pendingDateRange: 'dateRange'
            };
            const key = filterMap[filterType];
            if (key) {
              actions.updatePendingFilter(key, values as any);
            }
          }}
          onApplyFilters={() => {
            actions.applyFilters();
            setCurrentPage(1);
            const url = buildFilterUrl(query, pendingFilters, 1, sortBy);
            window.history.pushState({}, '', url);
            fetchResults(query, pendingFilters, 1, sortBy);
          }}
          onClearFilters={() => {
            actions.clearFilters();
            setCurrentPage(1);
            const url = buildFilterUrl(query, {
              year: [],
              topics: [],
              institutions: [],
              types: [],
              countries: [],
              authors: [],
              journals: [],
              textAvailability: [],
              dateRange: ''
            }, 1, sortBy);
            window.history.pushState({}, '', url);
            fetchResults(query, {
              year: [],
              topics: [],
              institutions: [],
              types: [],
              countries: [],
              authors: [],
              journals: [],
              textAvailability: [],
              dateRange: ''
            }, 1, sortBy);
          }}
        />

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {error && (
              <div className="flex items-center justify-center h-64 text-red-600">
                <p>Error: {error}</p>
              </div>
            )}
            
            {results && results.length === 0 && !loading && !error && (
              <div className="flex items-center justify-center h-64 text-gray-600">
                <p>No results found for your query.</p>
              </div>
            )}
            
            {(loading || (results && results.length > 0)) && !error && (
              <>
                {loading ? (
                  <HeaderSkeleton />
                ) : (
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-600">
                        {totalResults.toLocaleString()} results
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Sort by:</span>
                        <select
                          value={sortBy}
                          onChange={(e) => handleSortChange(e.target.value)}
                          className="text-sm border border-gray-300 rounded px-3 py-1 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="relevance_score:desc">Best Match</option>
                          <option value="publication_date:desc">Most Recent</option>
                          <option value="publication_date:asc">Oldest First</option>
                          <option value="cited_by_count:desc">Most Cited</option>
                          <option value="cited_by_count:asc">Least Cited</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <AIProviderSelector
                        selectedProvider={aiProvider}
                        selectedModel={aiModel}
                        onProviderChange={(provider, model) => {
                          setAIProvider(provider);
                          setAIModel(model);
                        }}
                      />
                      <ExtractButton
                        isExtracting={Object.values(extractionStates).some(s => s.status === 'fetching' || s.status === 'extracting')}
                        hasExtracted={Object.values(extractionStates).some(s => s.status === 'completed')}
                        onExtract={handleExtractAll}
                        onCancel={() => {
                          results?.forEach(result => cancelExtraction(result.id));
                        }}
                        disabled={!results || results.length === 0}
                      />
                    </div>
                  </div>
                )}
                
                <ConfigurationBar
                  configurations={configurations}
                  currentConfig={currentConfig}
                  selectedConfig={selectedConfig}
                  customFields={customFields}
                  userId={userId}
                  onConfigChange={handleConfigChange}
                  onManageFields={() => setShowFieldSettings(true)}
                  onAddColumn={handleAddColumn}
                  onSaveConfig={handleSaveConfig}
                />
                
                {loading ? (
                  <div className="space-y-0 border-t">
                    {[...Array(10)].map((_, i) => (
                      <ResultSkeleton key={i} />
                    ))}
                  </div>
                ) : results && (
                  <>
                    <ResultsTable
                      results={results}
                      customFields={customFields}
                      currentPage={currentPage}
                      aiResponses={aiResponses}
                      extractionStates={extractionStates}
                      onFieldEdit={setEditingField}
                      onFieldValueChange={updateFieldValue}
                      onViewFullText={(result) => setViewingFullText(result)}
                    />
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-300 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo />
              <span className="text-sm text-gray-600">OpenPaper Grid</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-blue-600 hover:underline">Documentation</a>
              <a href="#" className="text-blue-600 hover:underline">GitHub</a>
              <a href="#" className="text-blue-600 hover:underline">Discord</a>
              <a href="#" className="text-blue-600 hover:underline">API</a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200 text-xs text-gray-500 text-center">
            <p>© 2025 OpenPaper Grid. Open source under MIT License.</p>
            <p className="mt-1">Built with Next.js, Supabase, n8n, and OpenAlex</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AddFieldDialog
        show={showAddFieldDialog}
        showConfigBuilder={false}
        onClose={() => setShowAddFieldDialog(false)}
        onAdd={handleAddField}
      />
      
      {/* Field Settings Modal */}
      {showFieldSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Manage Fields</h2>
            <p className="text-gray-600 mb-4">Enable or disable fields for your configuration.</p>
            {/* Field management UI would go here */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowFieldSettings(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Field Editor Modal */}
      {editingField && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Edit Field Value</h2>
            <p className="text-gray-600 mb-4">
              Editing: {editingField.name}
            </p>
            {/* Field editor UI would go here */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingField(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Save logic would go here
                  setEditingField(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Full Text Viewer */}
      {viewingFullText && (
        <FullTextViewer
          workId={viewingFullText.id}
          title={viewingFullText.title}
          fullText={getFullTextData(viewingFullText.id)?.fullText}
          sections={getFullTextData(viewingFullText.id)?.sections}
          extractionPrompts={getExtractionPrompts(viewingFullText.id)}
          onClose={() => setViewingFullText(null)}
        />
      )}
    </main>
  );
} 