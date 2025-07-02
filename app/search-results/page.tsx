'use client';

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  SearchIcon,
  FileTextIcon,
  MessageCircleIcon,
  BarChart2Icon,
  Settings2Icon,
  DownloadIcon,
  DatabaseIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
  FilterIcon,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import DotGrid from "@/components/DotGrid";

// Helper function to deconstruct the inverted index into a readable string
const deconstructAbstract = (invertedIndex: Record<string, number[]>) => {
  if (!invertedIndex) return '';
  const wordPositions: { word: string; position: number }[] = [];
  for (const word in invertedIndex) {
    for (const pos of invertedIndex[word]) {
      wordPositions.push({ word, position: pos });
    }
  }
  wordPositions.sort((a, b) => a.position - b.position);
  return wordPositions.map(wp => wp.word).join(' ');
};

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get('query') || '';
  const initialYear = searchParams.get('year')?.split('|') || [];
  const initialCountries = searchParams.get('countries')?.split('|') || [];
  const initialAuthors = searchParams.get('authors')?.split('|') || [];
  const initialTextAvailability = searchParams.get('textAvailability')?.split('|') || [];
  const initialJournals = searchParams.get('journals')?.split('|') || [];

  const [query, setQuery] = useState(initialQuery);
  const [selectedYear, setSelectedYear] = useState<string[]>(initialYear);
  const [results, setResults] = useState<any[] | null>(null);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [yearBreakdown, setYearBreakdown] = useState<any[] | null>(null);
  const [typeBreakdown, setTypeBreakdown] = useState<any[] | null>(null);
  const [topicBreakdown, setTopicBreakdown] = useState<any[] | null>(null);
  const [institutionBreakdown, setInstitutionBreakdown] = useState<any[] | null>(null);
  const [countryBreakdown, setCountryBreakdown] = useState<any[] | null>(null);
  const [authorBreakdown, setAuthorBreakdown] = useState<any[] | null>(null);
  const [journalBreakdown, setJournalBreakdown] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New filter states
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedInstitutions, setSelectedInstitutions] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(initialCountries);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>(initialAuthors);
  const [selectedJournals, setSelectedJournals] = useState<string[]>(initialJournals);
  const [textAvailability, setTextAvailability] = useState<string[]>(initialTextAvailability);
  const [dateRange, setDateRange] = useState<string>('');
  
  // Pending filter states (before applying)
  const [pendingYear, setPendingYear] = useState<string[]>(initialYear);
  const [pendingTopics, setPendingTopics] = useState<string[]>([]);
  const [pendingInstitutions, setPendingInstitutions] = useState<string[]>([]);
  const [pendingTypes, setPendingTypes] = useState<string[]>([]);
  const [pendingCountries, setPendingCountries] = useState<string[]>(initialCountries);
  const [pendingAuthors, setPendingAuthors] = useState<string[]>(initialAuthors);
  const [pendingJournals, setPendingJournals] = useState<string[]>(initialJournals);
  const [pendingTextAvailability, setPendingTextAvailability] = useState<string[]>(initialTextAvailability);
  const [pendingDateRange, setPendingDateRange] = useState<string>('');
  
  // Show more states for filter lists
  const [showMoreState, setShowMoreState] = useState<Record<string, number>>({
    topic: 200,
    institution: 200,
    country: 200,
    author: 200,
    journal: 200,
  });
  
  // Search input states for filters
  const [filterSearchState, setFilterSearchState] = useState<Record<string, string>>({
    institution: '',
    author: '',
    journal: '',
  });
  
  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    year: true,
    topic: false,
    institution: false,
    type: false,
    country: false,
    author: false,
    journal: false,
  });

  const fetchResults = useCallback(async (
    searchQuery: string, 
    yearFilters: string[] = [],
    openAccess: boolean = false,
    topics: string[] = [],
    institutions: string[] = [],
    types: string[] = [],
    countries: string[] = [],
    authors: string[] = [],
    journals: string[] = [],
    textAvail: string[] = []
  ) => {
    if (!searchQuery) return;

    setLoading(true);
    setError(null);
    try {
      let apiUrl = `/api/search?query=${encodeURIComponent(searchQuery)}`;
      if (yearFilters.length > 0) {
        apiUrl += `&year=${yearFilters.join('|')}`;
      }
      if (openAccess) {
        apiUrl += `&openAccess=true`;
      }
      if (topics.length > 0) {
        apiUrl += `&topics=${topics.join('|')}`;
      }
      if (institutions.length > 0) {
        apiUrl += `&institutions=${institutions.join('|')}`;
      }
      if (types.length > 0) {
        apiUrl += `&types=${types.join('|')}`;
      }
      if (countries.length > 0) {
        apiUrl += `&countries=${countries.join('|')}`;
      }
      if (authors.length > 0) {
        apiUrl += `&authors=${authors.join('|')}`;
      }
      if (journals.length > 0) {
        apiUrl += `&journals=${journals.join('|')}`;
      }
      if (textAvail.length > 0) {
        apiUrl += `&textAvailability=${textAvail.join('|')}`;
      }
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong');
      }
      const data = await response.json();
      setResults(data.results || []);
      setTotalResults(data.meta?.count || 0);
      setYearBreakdown(data.group_by || []);
      setTypeBreakdown(data.type_breakdown || []);
      setTopicBreakdown(data.topic_breakdown || []);
      setInstitutionBreakdown(data.institution_breakdown || []);
      setCountryBreakdown(data.country_breakdown || []);
      setAuthorBreakdown(data.author_breakdown || []);
      setJournalBreakdown(data.journal_breakdown || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(initialQuery, initialYear, false, [], [], [], initialCountries, initialAuthors, initialJournals, initialTextAvailability);
  }, []); // Remove dependencies to prevent re-renders

  const handleSearch = () => {
    const newQuery = query.trim();
    if (newQuery) {
      // Keep existing filters when performing a new search
      updateFiltersAndFetch(selectedYear, false, selectedTopics, selectedInstitutions, selectedTypes, selectedCountries, selectedAuthors, selectedJournals, textAvailability);
    }
  };

  const handleYearFilter = (year: string) => {
    const newSelectedYears = selectedYear.includes(year)
      ? selectedYear.filter((y) => y !== year)
      : [...selectedYear, year];
    
    setSelectedYear(newSelectedYears);
    updateFiltersAndFetch(newSelectedYears, false, selectedTopics, selectedInstitutions, selectedTypes, selectedCountries, selectedAuthors, selectedJournals, textAvailability);
  };
  
  const handleTypeFilter = (type: string) => {
    const newSelectedTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];
    
    setSelectedTypes(newSelectedTypes);
    updateFiltersAndFetch(selectedYear, false, selectedTopics, selectedInstitutions, newSelectedTypes, selectedCountries, selectedAuthors, selectedJournals, textAvailability);
  };
  
  const handleTopicFilter = (topic: string) => {
    const newSelectedTopics = selectedTopics.includes(topic)
      ? selectedTopics.filter((t) => t !== topic)
      : [...selectedTopics, topic];
    
    setSelectedTopics(newSelectedTopics);
    updateFiltersAndFetch(selectedYear, false, newSelectedTopics, selectedInstitutions, selectedTypes, selectedCountries, selectedAuthors, selectedJournals, textAvailability);
  };
  
  const handleInstitutionFilter = (institution: string) => {
    const newSelectedInstitutions = selectedInstitutions.includes(institution)
      ? selectedInstitutions.filter((i) => i !== institution)
      : [...selectedInstitutions, institution];
    
    setSelectedInstitutions(newSelectedInstitutions);
    updateFiltersAndFetch(selectedYear, false, selectedTopics, newSelectedInstitutions, selectedTypes, selectedCountries, selectedAuthors, selectedJournals, textAvailability);
  };
  
  const updateFiltersAndFetch = (
    years: string[],
    openAccess: boolean,
    topics: string[],
    institutions: string[],
    types: string[],
    countries: string[] = [],
    authors: string[] = [],
    journals: string[] = [],
    textAvail: string[] = []
  ) => {
    const newQuery = query.trim();
    if (newQuery) {
      // Update URL without navigation
      let url = `/search-results?query=${encodeURIComponent(newQuery)}`;
      if (years.length > 0) {
        url += `&year=${years.join('|')}`;
      }
      if (openAccess) {
        url += `&openAccess=true`;
      }
      if (types.length > 0) {
        url += `&types=${types.join('|')}`;
      }
      if (topics.length > 0) {
        url += `&topics=${topics.join('|')}`;
      }
      if (institutions.length > 0) {
        url += `&institutions=${institutions.join('|')}`;
      }
      if (countries.length > 0) {
        url += `&countries=${countries.join('|')}`;
      }
      if (authors.length > 0) {
        url += `&authors=${authors.join('|')}`;
      }
      if (journals.length > 0) {
        url += `&journals=${journals.join('|')}`;
      }
      if (textAvail.length > 0) {
        url += `&textAvailability=${textAvail.join('|')}`;
      }
      window.history.pushState({}, '', url);
      
      // Fetch results with new filters
      fetchResults(newQuery, years, openAccess, topics, institutions, types, countries, authors, journals, textAvail);
    }
  };

  const handleClearFilters = () => {
    // Clear active filters
    setSelectedYear([]);
    setSelectedTopics([]);
    setSelectedInstitutions([]);
    setSelectedTypes([]);
    setSelectedCountries([]);
    setSelectedAuthors([]);
    setSelectedJournals([]);
    setTextAvailability([]);
    setDateRange('');
    
    // Clear pending filters
    setPendingYear([]);
    setPendingTopics([]);
    setPendingInstitutions([]);
    setPendingTypes([]);
    setPendingCountries([]);
    setPendingAuthors([]);
    setPendingJournals([]);
    setPendingTextAvailability([]);
    setPendingDateRange('');
    
    const newQuery = query.trim();
    if (newQuery) {
      window.history.pushState({}, '', `/search-results?query=${encodeURIComponent(newQuery)}`);
      fetchResults(newQuery, [], false, [], [], [], [], [], [], []);
    }
  };
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const getActiveFiltersCount = () => {
    let count = selectedYear.length + selectedTopics.length + selectedInstitutions.length + selectedTypes.length + selectedCountries.length + selectedAuthors.length + selectedJournals.length;
    if (textAvailability.length > 0) count++;
    if (dateRange) count++;
    return count;
  };
  
  const getPendingFiltersCount = () => {
    let count = pendingYear.length + pendingTopics.length + pendingInstitutions.length + pendingTypes.length + pendingCountries.length + pendingAuthors.length + pendingJournals.length;
    if (pendingTextAvailability.length > 0) count++;
    if (pendingDateRange) count++;
    return count;
  };
  
  const applyFilters = () => {
    // Apply all pending filters
    setSelectedYear(pendingYear);
    setSelectedTopics(pendingTopics);
    setSelectedInstitutions(pendingInstitutions);
    setSelectedTypes(pendingTypes);
    setSelectedCountries(pendingCountries);
    setSelectedAuthors(pendingAuthors);
    setSelectedJournals(pendingJournals);
    setTextAvailability(pendingTextAvailability);
    setDateRange(pendingDateRange);
    
    // Update URL and fetch
    updateFiltersAndFetch(
      pendingYear,
      false, // Keep for backwards compatibility
      pendingTopics,
      pendingInstitutions,
      pendingTypes,
      pendingCountries,
      pendingAuthors,
      pendingJournals,
      pendingTextAvailability
    );
  };
  
  const resetFilters = () => {
    // Reset all pending filters
    setPendingYear([]);
    setPendingTopics([]);
    setPendingInstitutions([]);
    setPendingTypes([]);
    setPendingCountries([]);
    setPendingAuthors([]);
    setPendingJournals([]);
    setPendingTextAvailability([]);
    setPendingDateRange('');
  };

  return (
    <main className="min-h-screen w-full bg-white text-gray-900 font-sans">
      {/* US Gov Banner */}
      <div className="bg-gray-100 text-xs py-1 px-4 border-b border-gray-300">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <span className="text-gray-600">🇺🇸</span>
          <span>An open-source alternative to AI research platforms like Elicit, Consensus, Scite.</span>
          <a href="#" className="text-blue-600 hover:underline ml-2">Here's how you deploy →</a>
        </div>
      </div>

      {/* NIH/NLM Style Header */}
      <header className="bg-white border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Logo />
              <div>
                <h1 className="text-2xl font-normal text-gray-900">OpenPaper Grid</h1>
                <p className="text-sm text-gray-600">AI-Powered Biomedical Literature Platform</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="text-blue-600 hover:text-blue-700 hover:bg-gray-50 font-normal"
            >
              Log in
            </Button>
          </div>
        </div>
      </header>

      {/* PubMed Style Hero/Search Section */}
      <section className="relative bg-gradient-to-b from-blue-600 to-blue-700 text-white min-h-[250px] flex items-center overflow-hidden">
        {/* Dot Grid Background */}
        <div className="absolute inset-0 opacity-50">
          <DotGrid
            dotSize={6}
            gap={25}
            baseColor="#ffffff20"
            activeColor="#ffffff"
            proximity={150}
            shockRadius={300}
            shockStrength={8}
            resistance={750}
            returnDuration={1.2}
            className="p-0"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 w-full">
          <div className="max-w-4xl mb-4">
            <h2 className="text-3xl font-normal mb-2">
              Search Results
            </h2>
            <p className="text-lg text-blue-50">
              Displaying results for: "{initialQuery}"
            </p>
          </div>

          <div className="w-full">
            <div className="bg-white rounded shadow-lg p-1">
              <div className="flex">
                <Input
                  type="search"
                  placeholder="Search biomedical literature (e.g., 'CRISPR gene editing 2023')"
                  className="flex-1 border-0 text-gray-900 text-base px-4 py-3 rounded-l focus:ring-0 focus:outline-none"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
                <Button
                  size="lg"
                  className="rounded-none rounded-r bg-blue-600 hover:bg-blue-700 text-white px-6 font-normal"
                  onClick={handleSearch}
                  disabled={loading}
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>
            <div className="mt-3 text-sm">
              <a href="#" className="text-white hover:underline" style={{ color: 'white' }}>Advanced Search</a>
            </div>
          </div>
        </div>
      </section>

      {/* Search Results Display Section */}
      <section className="w-full px-4 py-8">
        <Card className="shadow-lg">
          <CardContent className="p-6 min-h-[300px]">
            {loading && (
              <div className="flex items-center justify-center h-full text-gray-600">
                <p>Loading results...</p>
              </div>
            )}
            {error && (
              <div className="flex items-center justify-center h-full text-red-600">
                <p>Error: {error}</p>
              </div>
            )}
            {results && results.length === 0 && !loading && !error && (
              <div className="flex items-center justify-center h-full text-gray-600">
                <p>No results found for your query.</p>
              </div>
            )}
            {results && results.length > 0 && (
              <div className="flex gap-6">
                <div className="w-80 flex-shrink-0">
                  <div className="sticky top-4">
                    {/* Custom Filters Section */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">MY CUSTOM FILTERS</span>
                        <button className="p-1 hover:bg-gray-200 rounded" title="Manage filters">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Apply/Reset Filters Bar */}
                    {(getPendingFiltersCount() > 0 || getActiveFiltersCount() > 0) && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-900">
                            {getPendingFiltersCount() > 0 ? `${getPendingFiltersCount()} pending filter${getPendingFiltersCount() > 1 ? 's' : ''}` : 'Filters active'}
                          </span>
                          {getActiveFiltersCount() > 0 && (
                            <span className="text-xs text-blue-700">
                              {getActiveFiltersCount()} active
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={applyFilters}
                            size="sm"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={getPendingFiltersCount() === 0}
                          >
                            Apply Filters
                          </Button>
                          <Button 
                            onClick={resetFilters}
                            size="sm"
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-100"
                          >
                            Reset
                          </Button>
                          {getActiveFiltersCount() > 0 && (
                            <Button 
                              onClick={handleClearFilters}
                              size="sm"
                              variant="ghost"
                              className="text-blue-700 hover:bg-blue-100"
                            >
                              Clear All
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Filters Card */}
                    <Card className="shadow-sm border-gray-200">
                      <CardContent className="p-0">
                        
                        {/* Year Filter */}
                        <div className="border-b relative">
                          {JSON.stringify(pendingYear.sort()) !== JSON.stringify(selectedYear.sort()) && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400"></div>
                          )}
                          <button
                            onClick={() => toggleSection('year')}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <span className="font-medium text-sm">Year</span>
                            <div className="flex items-center gap-2">
                              {pendingYear.length > 0 && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  {pendingYear.length}
                                </span>
                              )}
                              {expandedSections.year ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                            </div>
                          </button>
                          {expandedSections.year && yearBreakdown && yearBreakdown.length > 0 && (
                            <div className="px-4 pb-4">
                              {/* Year Histogram */}
                              <div className="mb-4">
                                <div className="bg-gray-50 p-3 rounded">
                                  <div className="flex justify-between items-center mb-2">
                                    <h5 className="text-xs font-medium text-gray-700">
                                      RESULTS BY YEAR
                                      {pendingYear.length > 0 && (
                                        <span className="ml-2 font-normal text-gray-500">
                                          ({pendingYear.length} selected)
                                        </span>
                                      )}
                                    </h5>
                                    <button 
                                      className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                                      onClick={() => {
                                        setPendingYear([]);
                                        setPendingDateRange('');
                                      }}
                                      disabled={pendingYear.length === 0 && !pendingDateRange}
                                    >
                                      Clear
                                    </button>
                                  </div>
                                  <div className="relative">
                                    <div className="flex items-end gap-0.5 h-24 mb-1">
                                      {(() => {
                                        // Sort years chronologically and get last 25 years
                                        const sortedYears = [...yearBreakdown]
                                          .sort((a, b) => parseInt(a.key) - parseInt(b.key))
                                          .slice(-25);
                                        const maxCount = Math.max(...sortedYears.map((y: any) => y.count));
                                        
                                        return sortedYears.map((item: any) => {
                                          const height = (item.count / maxCount) * 100;
                                          const isSelected = pendingYear.includes(item.key);
                                          return (
                                            <button
                                              key={item.key}
                                              onClick={() => {
                                                if (pendingYear.includes(item.key)) {
                                                  setPendingYear(pendingYear.filter(y => y !== item.key));
                                                } else {
                                                  setPendingYear([...pendingYear, item.key]);
                                                }
                                              }}
                                              className={`flex-1 relative group ${
                                                isSelected ? 'bg-teal-600' : 'bg-teal-400'
                                              } hover:bg-teal-500 transition-colors rounded-t`}
                                              style={{ height: `${height}%`, minHeight: '2px' }}
                                              title={`${item.key}: ${item.count.toLocaleString()} papers`}
                                            />
                                          );
                                        });
                                      })()}
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-600 mt-2">
                                      <span>{yearBreakdown.length > 0 ? Math.min(...yearBreakdown.map(y => parseInt(y.key))) : '2000'}</span>
                                      <span>{new Date().getFullYear()}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Publication Date Options */}
                              <div className="mt-4">
                                <h5 className="text-xs font-medium text-gray-700 mb-2">PUBLICATION DATE</h5>
                                <div className="space-y-2">
                                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                      type="radio"
                                      name="dateRange"
                                      value="1"
                                      checked={pendingDateRange === '1'}
                                      onChange={(e) => {
                                        setPendingDateRange(e.target.value);
                                        const currentYear = new Date().getFullYear();
                                        setPendingYear([currentYear.toString()]);
                                      }}
                                      className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">1 year</span>
                                  </label>
                                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                      type="radio"
                                      name="dateRange"
                                      value="5"
                                      checked={pendingDateRange === '5'}
                                      onChange={(e) => {
                                        setPendingDateRange(e.target.value);
                                        const currentYear = new Date().getFullYear();
                                        const years = [];
                                        for (let i = 0; i < 5; i++) {
                                          years.push((currentYear - i).toString());
                                        }
                                        setPendingYear(years);
                                      }}
                                      className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">5 years</span>
                                  </label>
                                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                      type="radio"
                                      name="dateRange"
                                      value="10"
                                      checked={pendingDateRange === '10'}
                                      onChange={(e) => {
                                        setPendingDateRange(e.target.value);
                                        const currentYear = new Date().getFullYear();
                                        const years = [];
                                        for (let i = 0; i < 10; i++) {
                                          years.push((currentYear - i).toString());
                                        }
                                        setPendingYear(years);
                                      }}
                                      className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">10 years</span>
                                  </label>
                                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                      type="radio"
                                      name="dateRange"
                                      value="custom"
                                      checked={pendingDateRange === 'custom'}
                                      onChange={(e) => setPendingDateRange(e.target.value)}
                                      className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">Custom Range</span>
                                  </label>
                                  
                                  {pendingDateRange === 'custom' && (
                                    <div className="mt-2 ml-6 space-y-2">
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="number"
                                          placeholder="From"
                                          min="1900"
                                          max={new Date().getFullYear()}
                                          className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                                          onChange={(e) => {
                                            const fromYear = parseInt(e.target.value);
                                            const toYear = parseInt((e.target.nextElementSibling as HTMLInputElement)?.value || new Date().getFullYear().toString());
                                            if (fromYear && toYear && fromYear <= toYear) {
                                              const years = [];
                                              for (let y = fromYear; y <= toYear; y++) {
                                                years.push(y.toString());
                                              }
                                              setPendingYear(years);
                                            }
                                          }}
                                        />
                                        <input
                                          type="number"
                                          placeholder="To"
                                          min="1900"
                                          max={new Date().getFullYear()}
                                          className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                                          onChange={(e) => {
                                            const toYear = parseInt(e.target.value);
                                            const fromYear = parseInt((e.target.previousElementSibling as HTMLInputElement)?.value || '1900');
                                            if (fromYear && toYear && fromYear <= toYear) {
                                              const years = [];
                                              for (let y = fromYear; y <= toYear; y++) {
                                                years.push(y.toString());
                                              }
                                              setPendingYear(years);
                                            }
                                          }}
                                        />
                                      </div>
                                      <p className="text-xs text-gray-500">
                                        {pendingYear.length > 0 && `Selected: ${Math.min(...pendingYear.map(y => parseInt(y)))} - ${Math.max(...pendingYear.map(y => parseInt(y)))}`}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Text Availability Section */}
                        <div className="border-b relative">
                          {pendingTextAvailability[0] !== textAvailability[0] && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400"></div>
                          )}
                          <div className="px-4 py-3">
                            <h5 className="text-xs font-medium text-gray-700 mb-3">TEXT AVAILABILITY</h5>
                            <div className="space-y-2">
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                  type="radio"
                                  name="textAvailability"
                                  value=""
                                  checked={!pendingTextAvailability[0]}
                                  onChange={() => setPendingTextAvailability([])}
                                  className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-700">All</span>
                              </label>
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                  type="radio"
                                  name="textAvailability"
                                  value="is_oa"
                                  checked={pendingTextAvailability[0] === 'is_oa'}
                                  onChange={() => setPendingTextAvailability(['is_oa'])}
                                  className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-700">Is Open Access</span>
                              </label>
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                  type="radio"
                                  name="textAvailability"
                                  value="has_fulltext"
                                  checked={pendingTextAvailability[0] === 'has_fulltext'}
                                  onChange={() => setPendingTextAvailability(['has_fulltext'])}
                                  className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-700">Has Full Text</span>
                              </label>
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                  type="radio"
                                  name="textAvailability"
                                  value="abstract_only"
                                  checked={pendingTextAvailability[0] === 'abstract_only'}
                                  onChange={() => setPendingTextAvailability(['abstract_only'])}
                                  className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-700">Abstract Only</span>
                              </label>
                            </div>
                            
                            {/* Open Access Stats */}
                            {results && results.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-600">Open Access</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.round((results.filter((r: any) => r.open_access?.is_oa).length / results.length) * 100)}%` }}
                                      />
                                    </div>
                                    <span className="font-medium text-gray-700">
                                      {Math.round((results.filter((r: any) => r.open_access?.is_oa).length / results.length) * 100)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Topic Filter */}
                        <div className="border-b relative">
                          {JSON.stringify(pendingTopics.sort()) !== JSON.stringify(selectedTopics.sort()) && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400"></div>
                          )}
                          <button
                            onClick={() => toggleSection('topic')}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <span className="font-medium text-sm">Topic</span>
                            <div className="flex items-center gap-2">
                              {pendingTopics.length > 0 && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  {pendingTopics.length}
                                </span>
                              )}
                              {expandedSections.topic ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                            </div>
                          </button>
                          {expandedSections.topic && topicBreakdown && topicBreakdown.length > 0 && (
                            <div className="px-4 pb-4">
                              <div className="space-y-1 max-h-60 overflow-y-auto pr-2 -mr-2">
                                {topicBreakdown.slice(0, showMoreState.topic).map((item: any) => {
                                  // Extract topic ID from URL
                                  const topicId = item.key;
                                  const displayName = item.key_display_name || 'Unknown Topic';
                                  
                                  return (
                                    <label 
                                      key={item.key} 
                                      className="flex items-start gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-1 -mx-1 rounded"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={pendingTopics.includes(topicId)}
                                        onChange={() => {
                                          if (pendingTopics.includes(topicId)) {
                                            setPendingTopics(pendingTopics.filter(t => t !== topicId));
                                          } else {
                                            setPendingTopics([...pendingTopics, topicId]);
                                          }
                                        }}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 flex-shrink-0"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                          <span 
                                            className={`${pendingTopics.includes(topicId) ? 'font-semibold text-blue-600' : 'text-gray-700'} break-words`}
                                            title={displayName}
                                          >
                                            {displayName}
                                          </span>
                                          <span className="text-gray-500 text-xs flex-shrink-0 ml-1">{item.count.toLocaleString()}</span>
                                        </div>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                              {topicBreakdown.length > showMoreState.topic && (
                                <button
                                  onClick={() => setShowMoreState({...showMoreState, topic: showMoreState.topic + 50})}
                                  className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                                >
                                  Show more ({topicBreakdown.length - showMoreState.topic} more)
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Institution Filter */}
                        <div className="border-b relative">
                          {JSON.stringify(pendingInstitutions.sort()) !== JSON.stringify(selectedInstitutions.sort()) && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400"></div>
                          )}
                          <button
                            onClick={() => toggleSection('institution')}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <span className="font-medium text-sm">Institution</span>
                            <div className="flex items-center gap-2">
                              {pendingInstitutions.length > 0 && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  {pendingInstitutions.length}
                                </span>
                              )}
                              {expandedSections.institution ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                            </div>
                          </button>
                          {expandedSections.institution && institutionBreakdown && institutionBreakdown.length > 0 && (
                            <div className="px-4 pb-4">
                              {institutionBreakdown.length > 10 && (
                                <Input
                                  type="search"
                                  placeholder="Search institutions..."
                                  className="mb-2 h-8 text-sm"
                                  value={filterSearchState.institution}
                                  onChange={(e) => {
                                    setFilterSearchState({...filterSearchState, institution: e.target.value});
                                  }}
                                />
                              )}
                              <div className="space-y-1 max-h-60 overflow-y-auto pr-2 -mr-2">
                                {(() => {
                                  const searchTerm = filterSearchState.institution.toLowerCase();
                                  const filtered = searchTerm 
                                    ? institutionBreakdown.filter((item: any) => 
                                        (item.key_display_name || '').toLowerCase().includes(searchTerm)
                                      )
                                    : institutionBreakdown;
                                  const itemsToShow = showMoreState.institution;
                                  
                                  return filtered.slice(0, itemsToShow).map((item: any) => {
                                    const institutionId = item.key;
                                    const displayName = item.key_display_name || 'Unknown Institution';
                                    
                                    return (
                                      <label 
                                        key={item.key} 
                                        className="flex items-start gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-1 -mx-1 rounded"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={pendingInstitutions.includes(institutionId)}
                                          onChange={() => {
                                            if (pendingInstitutions.includes(institutionId)) {
                                              setPendingInstitutions(pendingInstitutions.filter(i => i !== institutionId));
                                            } else {
                                              setPendingInstitutions([...pendingInstitutions, institutionId]);
                                            }
                                          }}
                                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-start justify-between gap-2">
                                            <span 
                                              className={`${pendingInstitutions.includes(institutionId) ? 'font-semibold text-blue-600' : 'text-gray-700'} break-words`}
                                              title={displayName}
                                            >
                                              {displayName}
                                            </span>
                                            <span className="text-gray-500 text-xs flex-shrink-0 ml-1">{item.count.toLocaleString()}</span>
                                          </div>
                                        </div>
                                      </label>
                                    );
                                  });
                                })()}
                              </div>
                              {(() => {
                                const searchTerm = filterSearchState.institution.toLowerCase();
                                const filtered = searchTerm 
                                  ? institutionBreakdown.filter((item: any) => 
                                      (item.key_display_name || '').toLowerCase().includes(searchTerm)
                                    )
                                  : institutionBreakdown;
                                const itemsToShow = showMoreState.institution;
                                
                                return filtered.length > itemsToShow && (
                                  <button
                                    onClick={() => setShowMoreState({...showMoreState, institution: showMoreState.institution + 50})}
                                    className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                                  >
                                    Show more ({filtered.length - itemsToShow} more)
                                  </button>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                        
                        {/* Country Filter */}
                        <div className="border-b relative">
                          {JSON.stringify(pendingCountries.sort()) !== JSON.stringify(selectedCountries.sort()) && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400"></div>
                          )}
                          <button
                            onClick={() => toggleSection('country')}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <span className="font-medium text-sm">Country</span>
                            <div className="flex items-center gap-2">
                              {pendingCountries.length > 0 && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  {pendingCountries.length}
                                </span>
                              )}
                              {expandedSections.country ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                            </div>
                          </button>
                          {expandedSections.country && countryBreakdown && countryBreakdown.length > 0 && (
                            <div className="px-4 pb-4">
                              <div className="space-y-1 max-h-60 overflow-y-auto pr-2 -mr-2">
                                {countryBreakdown.slice(0, showMoreState.country).map((item: any) => {
                                  // Extract country code from URL if needed
                                  const countryKey = item.key.startsWith('https://openalex.org/countries/') 
                                    ? item.key.replace('https://openalex.org/countries/', '')
                                    : item.key;
                                  const displayName = item.key_display_name || countryKey;
                                  
                                  return (
                                    <label 
                                      key={item.key} 
                                      className="flex items-start gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-1 -mx-1 rounded"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={pendingCountries.includes(item.key)}
                                        onChange={() => {
                                          if (pendingCountries.includes(item.key)) {
                                            setPendingCountries(pendingCountries.filter(c => c !== item.key));
                                          } else {
                                            setPendingCountries([...pendingCountries, item.key]);
                                          }
                                        }}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 flex-shrink-0"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                          <span 
                                            className={`${pendingCountries.includes(item.key) ? 'font-semibold text-blue-600' : 'text-gray-700'} break-words`}
                                            title={displayName}
                                          >
                                            {displayName}
                                          </span>
                                          <span className="text-gray-500 text-xs flex-shrink-0 ml-1">{item.count.toLocaleString()}</span>
                                        </div>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                              {countryBreakdown.length > showMoreState.country && (
                                <button
                                  onClick={() => setShowMoreState({...showMoreState, country: showMoreState.country + 50})}
                                  className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                                >
                                  Show more ({countryBreakdown.length - showMoreState.country} more)
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Author Filter */}
                        <div className="border-b relative">
                          {JSON.stringify(pendingAuthors.sort()) !== JSON.stringify(selectedAuthors.sort()) && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400"></div>
                          )}
                          <button
                            onClick={() => toggleSection('author')}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <span className="font-medium text-sm">Author</span>
                            <div className="flex items-center gap-2">
                              {pendingAuthors.length > 0 && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  {pendingAuthors.length}
                                </span>
                              )}
                              {expandedSections.author ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                            </div>
                          </button>
                          {expandedSections.author && authorBreakdown && authorBreakdown.length > 0 && (
                            <div className="px-4 pb-4">
                              {authorBreakdown.length > 10 && (
                                <Input
                                  type="search"
                                  placeholder="Search authors..."
                                  className="mb-2 h-8 text-sm"
                                  value={filterSearchState.author}
                                  onChange={(e) => {
                                    setFilterSearchState({...filterSearchState, author: e.target.value});
                                  }}
                                />
                              )}
                              <div className="space-y-1 max-h-60 overflow-y-auto pr-2 -mr-2">
                                {(() => {
                                  const searchTerm = filterSearchState.author.toLowerCase();
                                  const filtered = searchTerm 
                                    ? authorBreakdown.filter((item: any) => 
                                        (item.key_display_name || '').toLowerCase().includes(searchTerm)
                                      )
                                    : authorBreakdown;
                                  const itemsToShow = showMoreState.author;
                                  
                                  return filtered.slice(0, itemsToShow).map((item: any) => {
                                    const authorId = item.key;
                                    const displayName = item.key_display_name || 'Unknown Author';
                                    
                                    return (
                                      <label 
                                        key={item.key} 
                                        className="flex items-start gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-1 -mx-1 rounded"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={pendingAuthors.includes(authorId)}
                                          onChange={() => {
                                            if (pendingAuthors.includes(authorId)) {
                                              setPendingAuthors(pendingAuthors.filter(a => a !== authorId));
                                            } else {
                                              setPendingAuthors([...pendingAuthors, authorId]);
                                            }
                                          }}
                                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-start justify-between gap-2">
                                            <span 
                                              className={`${pendingAuthors.includes(authorId) ? 'font-semibold text-blue-600' : 'text-gray-700'} break-words`}
                                              title={displayName}
                                            >
                                              {displayName}
                                            </span>
                                            <span className="text-gray-500 text-xs flex-shrink-0 ml-1">{item.count.toLocaleString()}</span>
                                          </div>
                                        </div>
                                      </label>
                                    );
                                  });
                                })()}
                              </div>
                              {(() => {
                                const searchTerm = filterSearchState.author.toLowerCase();
                                const filtered = searchTerm 
                                  ? authorBreakdown.filter((item: any) => 
                                      (item.key_display_name || '').toLowerCase().includes(searchTerm)
                                    )
                                  : authorBreakdown;
                                const itemsToShow = showMoreState.author;
                                
                                return filtered.length > itemsToShow && (
                                  <button
                                    onClick={() => setShowMoreState({...showMoreState, author: showMoreState.author + 50})}
                                    className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                                  >
                                    Show more ({filtered.length - itemsToShow} more)
                                  </button>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                        
                        {/* Journal Filter */}
                        <div className="border-b relative">
                          {JSON.stringify(pendingJournals.sort()) !== JSON.stringify(selectedJournals.sort()) && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400"></div>
                          )}
                          <button
                            onClick={() => toggleSection('journal')}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <span className="font-medium text-sm">Journal</span>
                            <div className="flex items-center gap-2">
                              {pendingJournals.length > 0 && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  {pendingJournals.length}
                                </span>
                              )}
                              {expandedSections.journal ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                            </div>
                          </button>
                          {expandedSections.journal && journalBreakdown && journalBreakdown.length > 0 && (
                            <div className="px-4 pb-4">
                              {journalBreakdown.length > 10 && (
                                <Input
                                  type="search"
                                  placeholder="Search journals..."
                                  className="mb-2 h-8 text-sm"
                                  value={filterSearchState.journal}
                                  onChange={(e) => {
                                    setFilterSearchState({...filterSearchState, journal: e.target.value});
                                  }}
                                />
                              )}
                              <div className="space-y-1 max-h-60 overflow-y-auto pr-2 -mr-2">
                                {(() => {
                                  const searchTerm = filterSearchState.journal.toLowerCase();
                                  const filtered = searchTerm 
                                    ? journalBreakdown.filter((item: any) => 
                                        (item.key_display_name || '').toLowerCase().includes(searchTerm)
                                      )
                                    : journalBreakdown;
                                  const itemsToShow = showMoreState.journal;
                                  
                                  return filtered.slice(0, itemsToShow).map((item: any) => {
                                    const journalId = item.key;
                                    const displayName = item.key_display_name || 'Unknown Journal';
                                    
                                    return (
                                      <label 
                                        key={item.key} 
                                        className="flex items-start gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-1 -mx-1 rounded"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={pendingJournals.includes(journalId)}
                                          onChange={() => {
                                            if (pendingJournals.includes(journalId)) {
                                              setPendingJournals(pendingJournals.filter(j => j !== journalId));
                                            } else {
                                              setPendingJournals([...pendingJournals, journalId]);
                                            }
                                          }}
                                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-start justify-between gap-2">
                                            <span 
                                              className={`${pendingJournals.includes(journalId) ? 'font-semibold text-blue-600' : 'text-gray-700'} break-words`}
                                              title={displayName}
                                            >
                                              {displayName}
                                            </span>
                                            <span className="text-gray-500 text-xs flex-shrink-0 ml-1">{item.count.toLocaleString()}</span>
                                          </div>
                                        </div>
                                      </label>
                                    );
                                  });
                                })()}
                              </div>
                              {(() => {
                                const searchTerm = filterSearchState.journal.toLowerCase();
                                const filtered = searchTerm 
                                  ? journalBreakdown.filter((item: any) => 
                                      (item.key_display_name || '').toLowerCase().includes(searchTerm)
                                    )
                                  : journalBreakdown;
                                const itemsToShow = showMoreState.journal;
                                
                                return filtered.length > itemsToShow && (
                                  <button
                                    onClick={() => setShowMoreState({...showMoreState, journal: showMoreState.journal + 50})}
                                    className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                                  >
                                    Show more ({filtered.length - itemsToShow} more)
                                  </button>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                        
                        {/* Article Type Filter */}
                        <div className="border-b relative">
                          {JSON.stringify(pendingTypes.sort()) !== JSON.stringify(selectedTypes.sort()) && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400"></div>
                          )}
                          <div className="px-4 py-3">
                            <h5 className="text-xs font-medium text-gray-700 mb-3">ARTICLE TYPE</h5>
                            {typeBreakdown && typeBreakdown.length > 0 && (
                              <div className="space-y-1 max-h-60 overflow-y-auto pr-2 -mr-2">
                                {typeBreakdown.map((item: any) => {
                                  const typeLabels: Record<string, string> = {
                                    'article': 'Article',
                                    'preprint': 'Preprint',
                                    'dataset': 'Dataset',
                                    'book': 'Book',
                                    'book-chapter': 'Book Chapter',
                                    'dissertation': 'Dissertation',
                                    'conference-paper': 'Conference Paper',
                                    'journal-article': 'Journal Article',
                                    'report': 'Report',
                                    'review': 'Review',
                                    'peer-review': 'Peer Review',
                                    'editorial': 'Editorial',
                                    'erratum': 'Erratum',
                                    'letter': 'Letter',
                                    'other': 'Other'
                                  };
                                  // Extract type key from URL if needed
                                  const typeKey = item.key.startsWith('https://openalex.org/types/') 
                                    ? item.key.replace('https://openalex.org/types/', '')
                                    : item.key;
                                  const displayName = item.key_display_name || typeLabels[typeKey] || typeKey;
                                  
                                  return (
                                    <label 
                                      key={item.key} 
                                      className="flex items-start gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-1 -mx-1 rounded"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={pendingTypes.includes(typeKey)}
                                        onChange={() => {
                                          if (pendingTypes.includes(typeKey)) {
                                            setPendingTypes(pendingTypes.filter(t => t !== typeKey));
                                          } else {
                                            setPendingTypes([...pendingTypes, typeKey]);
                                          }
                                        }}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 flex-shrink-0"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                          <span className={pendingTypes.includes(typeKey) ? 'font-semibold text-blue-600' : 'text-gray-700'}>
                                            {displayName}
                                          </span>
                                          <span className="text-gray-500 text-xs flex-shrink-0 ml-1">{item.count.toLocaleString()}</span>
                                        </div>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                <div className="flex-1">
                  {/* Active Filters Summary */}
                  {getActiveFiltersCount() > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Active filters:</span>
                        <button 
                          onClick={handleClearFilters}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedYear.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded-full text-xs">
                            Years: {selectedYear.join(', ')}
                          </span>
                        )}
                        {textAvailability.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded-full text-xs">
                            Text: {textAvailability[0] === 'is_oa' ? 'Open Access' : 
                                   textAvailability[0] === 'has_fulltext' ? 'Has Full Text' : 
                                   textAvailability[0] === 'abstract_only' ? 'Abstract Only' : ''}
                          </span>
                        )}
                        {selectedTypes.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded-full text-xs">
                            Types: {selectedTypes.length}
                          </span>
                        )}
                        {selectedTopics.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded-full text-xs">
                            Topics: {selectedTopics.length}
                          </span>
                        )}
                        {selectedInstitutions.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded-full text-xs">
                            Institutions: {selectedInstitutions.length}
                          </span>
                        )}
                        {selectedCountries.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded-full text-xs">
                            Countries: {selectedCountries.length}
                          </span>
                        )}
                        {selectedAuthors.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded-full text-xs">
                            Authors: {selectedAuthors.length}
                          </span>
                        )}
                        {selectedJournals.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded-full text-xs">
                            Journals: {selectedJournals.length}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Results Header */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {totalResults.toLocaleString()} results
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <button className="p-1 hover:bg-gray-200 rounded" disabled>
                          <ChevronLeftIcon className="h-4 w-4 text-gray-400" />
                        </button>
                        <span className="text-sm">Page</span>
                        <input
                          type="text"
                          value="1"
                          className="w-12 px-2 py-1 text-sm border border-gray-300 rounded text-center"
                          readOnly
                        />
                        <span className="text-sm">of {Math.ceil(totalResults / 25)}</span>
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <ChevronRightIcon className="h-4 w-4" />
                        </button>
                        <button className="p-1 hover:bg-gray-200 rounded ml-2">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Results List */}
                  <div className="space-y-0 border-t">
                    {results.map((result: any, index: number) => (
                      <div key={result.id} className="border-b border-gray-200 py-4">
                        <div className="flex gap-4">
                          <div className="flex-shrink-0 text-sm text-gray-500 w-8 text-right">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="mb-1">
                              <input type="checkbox" className="mr-2" />
                              <a 
                                href="#"
                                className="text-base font-medium text-blue-700 hover:underline"
                              >
                                {result.title}
                              </a>
                            </div>
                            <div className="text-sm text-gray-700 mb-1">
                              {result.authorships?.slice(0, 6).map((auth: any) => auth.author.display_name).join(', ')}
                              {result.authorships?.length > 6 && ', et al.'}
                            </div>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">{result.primary_location?.source?.display_name || 'Unknown source'}.</span>
                              {result.publication_year && ` ${result.publication_year}`}
                              {result.biblio?.volume && ` ${result.biblio.volume}`}
                              {result.biblio?.issue && `(${result.biblio.issue})`}
                              {result.biblio?.first_page && `:${result.biblio.first_page}`}
                              {result.biblio?.last_page && `-${result.biblio.last_page}`}.
                              {result.doi && (
                                <>
                                  {' doi: '}
                                  <a 
                                    href={`https://doi.org/${result.doi}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {result.doi}
                                  </a>.
                                </>
                              )}
                              {result.publication_date && ` Epub ${new Date(result.publication_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}.`}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              PMID: {result.ids?.pmid || result.id.split('/').pop()}
                              {result.open_access?.is_oa && (
                                <span className="ml-4 text-orange-600 font-medium">Free PMC article.</span>
                              )}
                              {result.type === 'preprint' && (
                                <span className="ml-4 text-gray-600">Preprint.</span>
                              )}
                            </div>
                            <button className="text-sm text-blue-600 hover:underline mt-2">
                              Cite
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-300 mt-20">
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
    </main>
  );
}
