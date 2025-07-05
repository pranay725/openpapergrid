'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Logo } from '@/components/Logo';
import { SearchHeader } from './components/SearchHeader';
import { ResultsTable } from './components/ResultsTable';
import { AddFieldDialog } from './components/FieldManagement/AddFieldDialog';
import { HeaderSkeleton, ResultSkeleton } from './components/Skeletons';
import { FilterSidebar } from './components/FilterSidebar';
import { Pagination } from './components/Pagination';
import { useSearchFilters } from './hooks/useSearchFilters';
import { useSearchResults } from './hooks/useSearchResults';
import { useAIResponses } from './hooks/useAIResponses';
import { useFullTextExtraction } from './hooks/useFullTextExtraction';
import { buildFilterUrl } from './utils/filterHelpers';
import type { SearchResultsClientProps, SearchFilters, SearchResult, ExtractionMetrics } from './types';
import { CustomField, ScreeningConfiguration } from '@/lib/database.types';
import { 
  setActiveConfiguration, 
  updateConfiguration
} from '@/lib/screening-config-api';
import { FullTextViewer } from './components/FullTextViewer';
import { InlineExtractionControls, ExtractionMode } from './components/InlineExtractionControls';
import { ConfigurationDialog } from './components/ConfigurationManagement/ConfigurationDialog';

export default function SearchResultsClientRefactored({ 
  configurations, 
  activeConfig, 
  userId 
}: SearchResultsClientProps) {
  const searchParams = useSearchParams();

  // Check authentication status
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usageData, setUsageData] = useState<{ searches: number; extractions: number }>({ searches: 0, extractions: 0 });
  
  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { createSupabaseClient } = await import('@/lib/supabase');
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      
      // Track anonymous usage in localStorage
      if (!session) {
        const storedUsage = localStorage.getItem('anonymousUsage');
        if (storedUsage) {
          setUsageData(JSON.parse(storedUsage));
        }
      }
    };
    checkAuth();
  }, []);

  // Track search usage
  const trackSearchUsage = () => {
    if (!isAuthenticated) {
      const newUsage = { ...usageData, searches: usageData.searches + 1 };
      setUsageData(newUsage);
      localStorage.setItem('anonymousUsage', JSON.stringify(newUsage));
    }
  };

  // Track extraction usage
  const trackExtractionUsage = () => {
    if (!isAuthenticated) {
      const newUsage = { ...usageData, extractions: usageData.extractions + 1 };
      setUsageData(newUsage);
      localStorage.setItem('anonymousUsage', JSON.stringify(newUsage));
    }
  };

  // Reset usage data daily
  useEffect(() => {
    if (!isAuthenticated) {
      const storedUsage = localStorage.getItem('anonymousUsage');
      const lastReset = localStorage.getItem('anonymousUsageLastReset');
      const today = new Date().toDateString();
      
      if (lastReset !== today) {
        // Reset usage for new day
        const resetUsage = { searches: 0, extractions: 0 };
        setUsageData(resetUsage);
        localStorage.setItem('anonymousUsage', JSON.stringify(resetUsage));
        localStorage.setItem('anonymousUsageLastReset', today);
      } else if (storedUsage) {
        // Load existing usage
        setUsageData(JSON.parse(storedUsage));
      }
    }
  }, [isAuthenticated]);

  // Parse initial values from URL
  const initialQuery = searchParams.get('query') || '';
  const initialPage = parseInt(searchParams.get('page') || '1');
  const initialSort = searchParams.get('sort') || 'relevance_score:desc';

  // Find Basic Screening configuration
  const basicScreeningConfig = configurations.find(c => c.name === 'Basic Screening' && c.visibility === 'default');
  
  // State - Set Basic Screening as default for non-authenticated users
  const [query, setQuery] = useState(initialQuery);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [sortBy, setSortBy] = useState(initialSort);
  const [currentConfig, setCurrentConfig] = useState(activeConfig || basicScreeningConfig || configurations[0]);
  const [customFields, setCustomFields] = useState<CustomField[]>((activeConfig || basicScreeningConfig)?.fields || []);
  const [selectedConfig, setSelectedConfig] = useState<string>((activeConfig || basicScreeningConfig)?.id || '');
  const [showAddFieldDialog, setShowAddFieldDialog] = useState(false);
  const [showFieldSettings, setShowFieldSettings] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [aiProvider, setAIProvider] = useState('openrouter');
  const [aiModel, setAIModel] = useState('openrouter/cypher-alpha:free');
  const [aiModel, setAIModel] = useState('openrouter/cypher-alpha:free');
  const [viewingFullText, setViewingFullText] = useState<SearchResult | null>(null);
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>('abstract');

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
    extractSingleField,
    retryExtraction,
    cancelExtraction, 
    getExtractionState, 
    extractionStates,
    getFullTextData,
    getExtractionPrompts,
    getExtractionMetrics
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
    model: aiModel,
    mode: extractionMode
    model: aiModel,
    mode: extractionMode
  });

  // Clear extraction data when mode changes
  useEffect(() => {
    if (prevExtractionModeRef.current !== extractionMode) {
      // Mode has actually changed
      prevExtractionModeRef.current = extractionMode;
      
      // Clear all extraction data when switching modes
      clearAllExtractionData();
      
      // Also clear AI responses
      if (results) {
        results.forEach(result => {
          clearResultResponses(result.id);
        });
      }
    }
  }, [extractionMode, clearAllExtractionData, results, clearResultResponses]);

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

  // Handle rate limit errors
  useEffect(() => {
    if (error && (error.includes('rate limit') || error.includes('Rate limit'))) {
      // Redirect to signup page with a message
      window.location.href = '/auth/signup?message=rate_limit_exceeded&redirect=' + encodeURIComponent(window.location.href);
    }
  }, [error]);

  // Initial fetch
  useEffect(() => {
    fetchResults(initialQuery, filters, initialPage, initialSort);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Auto-extract for non-authenticated users to show the AHA moment
  useEffect(() => {
    if (!isAuthenticated && results && results.length > 0 && !hasAutoExtracted && !loading) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        handleExtractAll();
        setHasAutoExtracted(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, results, hasAutoExtracted, loading]); // Exclude handleExtractAll to prevent loops

  const handleSearch = () => {
    if (!query.trim()) return;

    trackSearchUsage(); // Track usage
    
    const params = new URLSearchParams({
      query: query,
      page: currentPage.toString(),
      sort: sortBy
    });
    const url = buildFilterUrl(query, filters, currentPage, sortBy);
    window.history.pushState({}, '', url);
    fetchResults(query, filters, currentPage, sortBy);
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
      setShowConfigDialog(true);
      setShowConfigDialog(true);
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
    setShowConfigDialog(true);
    setShowConfigDialog(true);
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

  const handleExtractAll = async () => {
    if (!results || results.length === 0) return;

    trackExtractionUsage(); // Track usage

    // Process all visible results
    results.forEach(result => {
      const state = getExtractionState(result.id);
      if (state.status === 'idle') {
        processWork(result, customFields);
      }
    });
  };
  
  const handleRetryExtraction = (result: SearchResult) => {
    retryExtraction(result, customFields);
  };
  
  const handleRefreshExtraction = (result: SearchResult) => {
    processWork(result, customFields, true); // Force refresh
  };
  
  const handleExtractSingleField = (result: SearchResult, field: CustomField) => {
    extractSingleField(result, field, true); // Force refresh for single field
  };

  const totalPages = Math.ceil(totalResults / 10);

  // Handle extraction mode change for non-authenticated users
  const handleExtractionModeChange = (mode: ExtractionMode) => {
    if (!isAuthenticated && mode === 'fulltext') {
      // Show sign-up prompt for full text mode
      if (confirm('Full text extraction is available for registered users. Would you like to sign up for free?')) {
        window.location.href = '/auth/signup?message=fulltext_feature&redirect=' + encodeURIComponent(window.location.href);
      }
      return;
    }
    setExtractionMode(mode);
  };

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

      {/* Subtle usage indicator for anonymous users */}
      {!isAuthenticated && (usageData.searches > 0 || usageData.extractions > 0) && (
        <div className={`px-6 py-2 border-b ${
          usageData.searches >= 40 || usageData.extractions >= 16 
            ? 'bg-amber-50 border-amber-100' 
            : 'bg-gray-50 border-gray-100'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className={usageData.searches >= 40 ? 'text-amber-700 font-medium' : 'text-gray-600'}>
                Free usage today: {usageData.searches}/50 searches
              </span>
              {usageData.extractions > 0 && (
                <span className={usageData.extractions >= 16 ? 'text-amber-700 font-medium' : 'text-gray-600'}>
                  {usageData.extractions}/20 extractions
                </span>
              )}
            </div>
            <a href="/auth/signup" className={`hover:underline ${
              usageData.searches >= 40 || usageData.extractions >= 16 
                ? 'text-amber-700 font-medium' 
                : 'text-blue-600'
            }`}>
              {usageData.searches >= 40 || usageData.extractions >= 16 
                ? 'Sign up now to continue →' 
                : 'Sign up for unlimited access →'}
            </a>
          </div>
        </div>
      )}

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
                  <InlineExtractionControls
                    // Extraction props
                    extractionMode={extractionMode}
                    onModeChange={setExtractionMode}
                    selectedProvider={aiProvider}
                    selectedModel={aiModel}
                    onProviderChange={(provider: string, model: string) => {
                      setAIProvider(provider);
                      setAIModel(model);
                    }}
                    isExtracting={Object.values(extractionStates).some(s => s.status === 'fetching' || s.status === 'extracting')}
                    hasExtracted={Object.values(extractionStates).some(s => s.status === 'completed')}
                    onExtract={handleExtractAll}
                    onCancel={() => {
                      results?.forEach(result => cancelExtraction(result.id));
                    }}
                    extractDisabled={!results || results.length === 0}
                    // Configuration props
                    configurations={configurations}
                    currentConfig={currentConfig}
                    selectedConfig={selectedConfig}
                    customFields={customFields}
                    userId={userId}
                    onConfigChange={handleConfigChange}
                    onManageFields={() => setShowConfigDialog(true)}
                    onEditConfig={(config: ScreeningConfiguration) => {
                      setCurrentConfig(config);
                      setSelectedConfig(config.id);
                      setShowConfigDialog(true);
                    }}
                    onDeleteConfig={async (configId: string) => {
                      try {
                        const { deleteConfiguration } = await import('@/lib/screening-config-api');
                        await deleteConfiguration(configId);
                        // Refresh configurations
                        window.location.reload();
                      } catch (error) {
                        alert('Failed to delete configuration');
                      }
                    }}
                    // Results props
                    totalResults={totalResults}
                    sortBy={sortBy}
                    onSortChange={handleSortChange}
                  />
                )}
                
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
                      extractionMetrics={results.reduce((acc, result) => {
                        const metrics = getExtractionMetrics(result.id);
                        if (metrics) acc[result.id] = metrics;
                        return acc;
                      }, {} as Record<string, ExtractionMetrics>)}
                      onFieldEdit={setEditingField}
                      onFieldValueChange={updateFieldValue}
                      onViewFullText={(result) => setViewingFullText(result)}
                      onRetryExtraction={handleRetryExtraction}
                      onRefreshExtraction={handleRefreshExtraction}
                      onExtractSingleField={handleExtractSingleField}
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
      <ConfigurationDialog
        show={showConfigDialog}
        configurations={configurations}
        currentConfig={currentConfig}
        userId={userId}
        onClose={() => setShowConfigDialog(false)}
        onConfigChange={(config) => {
          setCurrentConfig(config);
          setSelectedConfig(config.id);
          setCustomFields(config.fields.filter(f => f.enabled));
        }}
        onFieldsUpdate={(fields) => {
          setCustomFields(fields.filter(f => f.enabled));
        }}
      />
      
      <ConfigurationDialog
        show={showConfigDialog}
        configurations={configurations}
        currentConfig={currentConfig}
        userId={userId}
        onClose={() => setShowConfigDialog(false)}
        onConfigChange={(config) => {
          setCurrentConfig(config);
          setSelectedConfig(config.id);
          setCustomFields(config.fields.filter(f => f.enabled));
        }}
        onFieldsUpdate={(fields) => {
          setCustomFields(fields.filter(f => f.enabled));
        }}
      />
      
      <AddFieldDialog
        show={showAddFieldDialog}
        showConfigBuilder={false}
        onClose={() => setShowAddFieldDialog(false)}
        onAdd={handleAddField}
      />
      
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
          result={viewingFullText}
          fullText={getFullTextData(viewingFullText.id)?.fullText}
          sections={getFullTextData(viewingFullText.id)?.sections}
          extractionPrompts={getExtractionPrompts(viewingFullText.id)}
          extractionState={getExtractionState(viewingFullText.id)}
          provider={aiProvider}
          model={aiModel}
          onFetchFullText={() => processWork(viewingFullText, [])}
          metrics={getExtractionMetrics(viewingFullText.id)}
          onClose={() => setViewingFullText(null)}
        />
      )}
    </main>
  );
} 