'use client';

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  PlusIcon,
  TrashIcon,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Header } from "@/components/Header";
import DotGrid from "@/components/DotGrid";
import type { ScreeningConfiguration, CustomField } from '@/lib/database.types';
import { 
  setActiveConfiguration, 
  createConfiguration, 
  updateConfiguration,
  deleteConfiguration,
  duplicateConfiguration
} from '@/lib/screening-config-api';

interface SearchResultsClientProps {
  configurations: ScreeningConfiguration[];
  activeConfig: ScreeningConfiguration | null;
  userId: string;
}

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

// Skeleton loader components
const FilterSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-lg shadow-sm animate-pulse">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="border-b p-4">
        <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-4/5"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    ))}
  </div>
);

const ResultSkeleton = () => (
  <div className="border-b border-gray-200 py-4 animate-pulse">
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8">
        <div className="h-4 bg-gray-200 rounded w-6"></div>
      </div>
      <div className="flex-1">
        <div className="mb-2">
          <div className="h-5 bg-gray-300 rounded w-3/4"></div>
        </div>
        <div className="mb-2">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="space-y-1">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
        <div className="mt-2 flex gap-4">
          <div className="h-3 bg-gray-200 rounded w-20"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  </div>
);

const HeaderSkeleton = () => (
  <div className="mb-4 flex items-center justify-between animate-pulse">
    <div className="flex items-center gap-4">
      <div className="h-4 bg-gray-200 rounded w-24"></div>
      <div className="flex items-center gap-2">
        <div className="h-4 bg-gray-200 rounded w-16"></div>
        <div className="h-8 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <div className="h-8 bg-gray-200 rounded w-8"></div>
      <div className="h-4 bg-gray-200 rounded w-12"></div>
      <div className="h-8 bg-gray-200 rounded w-12"></div>
      <div className="h-4 bg-gray-200 rounded w-12"></div>
      <div className="h-8 bg-gray-200 rounded w-8"></div>
      <div className="h-8 bg-gray-200 rounded w-8"></div>
    </div>
  </div>
);

export default function SearchResultsClient({ 
  configurations, 
  activeConfig, 
  userId 
}: SearchResultsClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get('query') || '';
  const initialYear = searchParams.get('year')?.split('|') || [];
  const initialCountries = searchParams.get('countries')?.split('|') || [];
  const initialAuthors = searchParams.get('authors')?.split('|') || [];
  const initialTextAvailability = searchParams.get('textAvailability')?.split('|') || [];
  const initialJournals = searchParams.get('journals')?.split('|') || [];
  const initialPage = parseInt(searchParams.get('page') || '1');
  const initialSort = searchParams.get('sort') || 'relevance_score:desc';

  const [query, setQuery] = useState(initialQuery);
  const [selectedYear, setSelectedYear] = useState<string[]>(initialYear);
  const [results, setResults] = useState<any[] | null>(null);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [sortBy, setSortBy] = useState<string>(initialSort);
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
  
  // Custom fields state
  const [showFieldSettings, setShowFieldSettings] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);
  const [selectedConfig, setSelectedConfig] = useState<string>(activeConfig?.id || '');
  const [showAddFieldDialog, setShowAddFieldDialog] = useState(false);
  const [showCreateConfigDialog, setShowCreateConfigDialog] = useState(false);
  const [configBuilder, setConfigBuilder] = useState<{name: string, fields: any[]}>({name: '', fields: []});
  const [showConfigBuilder, setShowConfigBuilder] = useState(false);
  const [editingFieldInBuilder, setEditingFieldInBuilder] = useState<any>(null);
  
  // Use configurations from database
  const [currentConfig, setCurrentConfig] = useState<ScreeningConfiguration | null>(activeConfig);
  const [customFields, setCustomFields] = useState<CustomField[]>(activeConfig?.fields || []);
  const [availableConfigs, setAvailableConfigs] = useState<ScreeningConfiguration[]>(configurations);
  
  // Update custom fields when config changes
  useEffect(() => {
    if (currentConfig) {
      setCustomFields(currentConfig.fields.filter(f => f.enabled));
    }
  }, [currentConfig]);
  
  // Handle configuration change
  const handleConfigChange = async (configId: string) => {
    try {
      // Find the selected configuration
      const newConfig = availableConfigs.find(c => c.id === configId);
      if (!newConfig) return;
      
      // Update local state
      setSelectedConfig(configId);
      setCurrentConfig(newConfig);
      
      // Update in database
      await setActiveConfiguration(configId);
    } catch (error) {
      console.error('Error changing configuration:', error);
      // TODO: Show error toast
    }
  };
  
  // Handle creating new configuration
  const handleCreateConfiguration = async (name: string, description: string, fields: CustomField[], visibility: 'private' | 'community' = 'private') => {
    try {
      const newConfig = await createConfiguration(name, description, fields, visibility);
      
      // Update local state
      setAvailableConfigs([...availableConfigs, newConfig]);
      setCurrentConfig(newConfig);
      setSelectedConfig(newConfig.id);
      
      // Set as active
      await setActiveConfiguration(newConfig.id);
      
      return newConfig;
    } catch (error) {
      console.error('Error creating configuration:', error);
      throw error;
    }
  };
  
  // Handle updating configuration
  const handleUpdateConfiguration = async (configId: string, updates: {
    name?: string;
    description?: string;
    fields?: CustomField[];
    visibility?: 'private' | 'community' | 'default';
    is_active?: boolean;
  }) => {
    try {
      // Convert null description to empty string for the API
      const apiUpdates = {
        ...updates,
        description: updates.description === null ? '' : updates.description
      };
      const updatedConfig = await updateConfiguration(configId, apiUpdates);
      
      // Update local state
      setAvailableConfigs(availableConfigs.map(c => c.id === configId ? updatedConfig : c));
      if (currentConfig?.id === configId) {
        setCurrentConfig(updatedConfig);
      }
      
      return updatedConfig;
    } catch (error) {
      console.error('Error updating configuration:', error);
      throw error;
    }
  };
  
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  
  // Mock AI-generated responses with confidence and citations
  const [aiResponses, setAiResponses] = useState<Record<string, any>>({});
  
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
    textAvail: string[] = [],
    page: number = 1,
    sort: string = 'relevance_score:desc'
  ) => {
    if (!searchQuery) return;

    setLoading(true);
    setError(null);
    try {
      let apiUrl = `/api/search?query=${encodeURIComponent(searchQuery)}&page=${page}&sort=${encodeURIComponent(sort)}`;
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
    fetchResults(initialQuery, initialYear, false, [], [], [], initialCountries, initialAuthors, initialJournals, initialTextAvailability, initialPage, initialSort);
  }, []); // Remove dependencies to prevent re-renders

  // Generate mock AI responses when results change
  useEffect(() => {
    if (results && results.length > 0) {
      const mockResponses: Record<string, any> = {};
      
      results.forEach((result: any) => {
        // Mock AI responses for each AI-enabled field
        customFields.filter(f => f.isAI && f.enabled).forEach(field => {
          const responseKey = `${result.id}_${field.id}`;
          
          if (field.type === 'multi_select') {
            // Mock multi-select response
            const options = field.options || [];
            const selectedCount = Math.floor(Math.random() * 2) + 1;
            const selected = options.sort(() => 0.5 - Math.random()).slice(0, selectedCount);
            mockResponses[responseKey] = {
              value: selected,
              confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
              citations: [
                { text: "Based on abstract analysis", location: "Abstract, lines 3-5" },
                { text: "Methods section indicates", location: "Methods, paragraph 2" }
              ]
            };
          } else if (field.type === 'text') {
            // Mock text responses
            const sampleTexts: Record<string, string[]> = {
              biomarker_selection: [
                "The study does not require molecular, genetic, or proteomic biomarker selection for enrollment or treatment allocation",
                "Eligibility criteria require a documented diagnosis of Primary Hyperoxaluria Type 1 (PH1) confirmed by genotyping",
                "Patients must have HER2-positive breast cancer confirmed by IHC 3+ or FISH amplification",
                "EGFR mutation status (exon 19 deletion or L858R) required for enrollment"
              ],
              patient_population: [
                "Adults aged 45-65 with Type 2 diabetes",
                "Pediatric patients with acute lymphoblastic leukemia",
                "Healthy volunteers aged 18-35"
              ],
              primary_endpoint: [
                "Overall survival at 24 months",
                "Progression-free survival compared to standard of care",
                "Complete response rate at 6 months",
                "Change in tumor size from baseline"
              ],
              techniques: [
                "Western blot, qPCR, immunofluorescence microscopy",
                "CRISPR-Cas9 gene editing, flow cytometry",
                "Mass spectrometry, protein crystallography"
              ],
              main_findings: [
                "Treatment reduced symptoms by 45% compared to placebo",
                "Novel pathway identified linking protein X to disease progression",
                "Meta-analysis shows consistent effect across 12 studies"
              ]
            };
            
            const texts = sampleTexts[field.id] || ["Sample generated text for " + field.name];
            mockResponses[responseKey] = {
              value: texts[Math.floor(Math.random() * texts.length)],
              confidence: Math.random() * 0.2 + 0.75, // 75-95% confidence
              citations: [
                { text: "Extracted from results", location: "Results, Table 2" }
              ]
            };
          } else if (field.type === 'number') {
            // Mock number responses
            const value = field.id === 'sample_size' 
              ? Math.floor(Math.random() * 500) + 50
              : field.id === 'studies_included'
              ? Math.floor(Math.random() * 50) + 10
              : Math.floor(Math.random() * 100);
              
            mockResponses[responseKey] = {
              value: value,
              confidence: Math.random() * 0.1 + 0.85, // 85-95% confidence
              citations: [
                { text: "From study design section", location: "Methods, Study Design" }
              ]
            };
          } else if (field.type === 'select') {
            // Mock single select
            const options = field.options || [];
            mockResponses[responseKey] = {
              value: options[Math.floor(Math.random() * options.length)],
              confidence: Math.random() * 0.2 + 0.8, // 80-100% confidence
              citations: [
                { text: "Identified in methodology", location: "Methods, paragraph 1" }
              ]
            };
          } else if (field.type === 'boolean') {
            // Mock boolean response
            mockResponses[responseKey] = {
              value: Math.random() > 0.5,
              confidence: Math.random() * 0.15 + 0.85, // 85-100% confidence
              citations: [
                { text: "Confirmed in study design", location: "Abstract, first paragraph" }
              ]
            };
          }
        });
      });
      
      setAiResponses(mockResponses);
    }
  }, [results, customFields]);

  const handleSearch = () => {
    const newQuery = query.trim();
    if (newQuery) {
      // Keep existing filters when performing a new search but reset to page 1
      setCurrentPage(1);
      updateFiltersAndFetch(selectedYear, false, selectedTopics, selectedInstitutions, selectedTypes, selectedCountries, selectedAuthors, selectedJournals, textAvailability, 1);
    }
  };

  const handleYearFilter = (year: string) => {
    const newSelectedYears = selectedYear.includes(year)
      ? selectedYear.filter((y) => y !== year)
      : [...selectedYear, year];
    
    setSelectedYear(newSelectedYears);
    setCurrentPage(1);
    updateFiltersAndFetch(newSelectedYears, false, selectedTopics, selectedInstitutions, selectedTypes, selectedCountries, selectedAuthors, selectedJournals, textAvailability, 1);
  };
  
  const handleTypeFilter = (type: string) => {
    const newSelectedTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];
    
    setSelectedTypes(newSelectedTypes);
    setCurrentPage(1);
    updateFiltersAndFetch(selectedYear, false, selectedTopics, selectedInstitutions, newSelectedTypes, selectedCountries, selectedAuthors, selectedJournals, textAvailability, 1);
  };
  
  const handleTopicFilter = (topic: string) => {
    const newSelectedTopics = selectedTopics.includes(topic)
      ? selectedTopics.filter((t) => t !== topic)
      : [...selectedTopics, topic];
    
    setSelectedTopics(newSelectedTopics);
    setCurrentPage(1);
    updateFiltersAndFetch(selectedYear, false, newSelectedTopics, selectedInstitutions, selectedTypes, selectedCountries, selectedAuthors, selectedJournals, textAvailability, 1);
  };
  
  const handleInstitutionFilter = (institution: string) => {
    const newSelectedInstitutions = selectedInstitutions.includes(institution)
      ? selectedInstitutions.filter((i) => i !== institution)
      : [...selectedInstitutions, institution];
    
    setSelectedInstitutions(newSelectedInstitutions);
    setCurrentPage(1);
    updateFiltersAndFetch(selectedYear, false, selectedTopics, newSelectedInstitutions, selectedTypes, selectedCountries, selectedAuthors, selectedJournals, textAvailability, 1);
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
    textAvail: string[] = [],
    page: number = 1,
    sort: string = sortBy
  ) => {
    const newQuery = query.trim();
    if (newQuery) {
      // Update URL without navigation
      let url = `/search-results?query=${encodeURIComponent(newQuery)}`;
      if (page > 1) {
        url += `&page=${page}`;
      }
      if (sort !== 'relevance_score:desc') {
        url += `&sort=${encodeURIComponent(sort)}`;
      }
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
      fetchResults(newQuery, years, openAccess, topics, institutions, types, countries, authors, journals, textAvail, page, sort);
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
    
    // Reset page and sort
    setCurrentPage(1);
    setSortBy('relevance_score:desc');
    
    const newQuery = query.trim();
    if (newQuery) {
      window.history.pushState({}, '', `/search-results?query=${encodeURIComponent(newQuery)}`);
      fetchResults(newQuery, [], false, [], [], [], [], [], [], [], 1, 'relevance_score:desc');
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
    
    // Reset to page 1 when applying filters
    setCurrentPage(1);
    
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
      pendingTextAvailability,
      1
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

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateFiltersAndFetch(
      selectedYear,
      false,
      selectedTopics,
      selectedInstitutions,
      selectedTypes,
      selectedCountries,
      selectedAuthors,
      selectedJournals,
      textAvailability,
      newPage
    );
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setCurrentPage(1); // Reset to first page when changing sort
    updateFiltersAndFetch(
      selectedYear,
      false,
      selectedTopics,
      selectedInstitutions,
      selectedTypes,
      selectedCountries,
      selectedAuthors,
      selectedJournals,
      textAvailability,
      1,
      newSort
    );
  };

  const totalPages = Math.ceil(totalResults / 10);

  // AI Response Cell Component
  const AIResponseCell = ({ field, result }: { field: any, result: any }) => {
    const responseKey = `${result.id}_${field.id}`;
    const aiResponse = aiResponses[responseKey];
    const [showCitations, setShowCitations] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    
    if (!aiResponse) {
    return (
        <div className="bg-gray-50 rounded-md p-2 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="flex items-center gap-2">
            <div className="h-3 bg-gray-200 rounded w-16"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      );
    }
    
    const confidenceLevel = aiResponse.confidence > 0.9 ? 'High' : 
                           aiResponse.confidence > 0.7 ? 'Medium' : 
                           aiResponse.confidence > 0.5 ? 'Low' : 'Unknown';
    
    const confidenceColor = {
      'High': 'text-green-600 bg-green-50',
      'Medium': 'text-yellow-600 bg-yellow-50',
      'Low': 'text-orange-600 bg-orange-50',
      'Unknown': 'text-gray-600 bg-gray-50'
    }[confidenceLevel];
    
    const renderValue = () => {
      if (isEditing) {
        return (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => {
              setIsEditing(false);
              // Save the edited value
              setFieldValues({
                ...fieldValues,
                [`${result.id}_${field.id}`]: editValue
              });
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                setIsEditing(false);
                setFieldValues({
                  ...fieldValues,
                  [`${result.id}_${field.id}`]: editValue
                });
              }
            }}
            className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        );
      }
      
      if (field.type === 'multi_select' && Array.isArray(aiResponse.value)) {
        return (
          <div className="text-sm text-gray-900">
            {aiResponse.value.join(', ')}
          </div>
        );
      }
      
      if (field.type === 'boolean') {
        return (
          <div className="text-sm text-gray-900">
            {aiResponse.value ? 'Yes' : 'No'}
          </div>
        );
      }
      
      if (!aiResponse.value || aiResponse.value === '') {
        return <span className="text-sm text-gray-400 italic">Empty</span>;
      }
      
      return <div className="text-sm text-gray-900">{aiResponse.value}</div>;
    };
    
    return (
      <div className="bg-gray-50 rounded-md p-2 hover:bg-gray-100 transition-colors">
        <div 
          className="cursor-pointer"
          onClick={() => {
            if (!isEditing) {
              setEditValue(Array.isArray(aiResponse.value) ? aiResponse.value.join(', ') : aiResponse.value || '');
              setIsEditing(true);
            }
          }}
        >
          {renderValue()}
        </div>
        
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${confidenceColor}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current mr-1"></span>
              {confidenceLevel}
            </span>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCitations(!showCitations);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <FileTextIcon className="h-3 w-3" />
            {aiResponse.citations.length} source{aiResponse.citations.length !== 1 ? 's' : ''}
          </button>
        </div>
        
        {showCitations && (
          <div className="mt-2 p-2 bg-white border border-gray-200 rounded text-xs">
            {aiResponse.citations.map((citation: any, idx: number) => (
              <div key={idx} className="mb-1 last:mb-0">
                <div className="text-gray-700">{citation.text}</div>
                <div className="text-gray-500 text-xs mt-0.5">{citation.location}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Field Settings Modal Component
  const FieldSettingsModal = () => {
    if (!showFieldSettings) return null;

    // Field Editor Component
    const FieldEditor = ({ field }: { field: any }) => {
      const [localField, setLocalField] = useState(field);
      const [newOption, setNewOption] = useState('');

      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Edit Field: {field.name}</h3>
                <button
                  onClick={() => setEditingField(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Name
                </label>
                <Input
                  value={localField.name}
                  onChange={(e) => setLocalField({...localField, name: e.target.value})}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Type
                </label>
                <select
                  value={localField.type}
                  onChange={(e) => setLocalField({...localField, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="select">Single Select</option>
                  <option value="multi_select">Multi Select</option>
                  <option value="date">Date</option>
                  <option value="url">URL</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prompt / Description
                </label>
                <textarea
                  value={localField.prompt}
                  onChange={(e) => setLocalField({...localField, prompt: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe what this field should capture..."
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localField.isAI}
                    onChange={(e) => setLocalField({...localField, isAI: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">AI-Generated Field</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Enable this if the field value should be automatically generated using AI
                </p>
              </div>
              
              {(localField.type === 'select' || localField.type === 'multi_select') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Options
                  </label>
                  <div className="space-y-2">
                    {localField.options?.map((option: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(localField.options || [])];
                            newOptions[index] = e.target.value;
                            setLocalField({...localField, options: newOptions});
                          }}
                          className="flex-1"
                        />
                        <button
                          onClick={() => {
                            const newOptions = localField.options?.filter((_: any, i: number) => i !== index);
                            setLocalField({...localField, options: newOptions});
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <XIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <Input
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        placeholder="Add new option"
                        className="flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newOption.trim()) {
                            setLocalField({
                              ...localField, 
                              options: [...(localField.options || []), newOption.trim()]
                            });
                            setNewOption('');
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (newOption.trim()) {
                            setLocalField({
                              ...localField, 
                              options: [...(localField.options || []), newOption.trim()]
                            });
                            setNewOption('');
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setEditingField(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setCustomFields(customFields.map(f => f.id === field.id ? localField : f));
                  setEditingField(null);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      );
    };

    if (editingField) {
      return <FieldEditor field={editingField} />;
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Customize Fields</h2>
              <button
                onClick={() => setShowFieldSettings(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Existing Fields */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Active Fields</h3>
              <div className="space-y-2">
                {customFields.map((field) => (
                  <div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={field.enabled}
                        onChange={(e) => {
                          setCustomFields(customFields.map(f => 
                            f.id === field.id ? { ...f, enabled: e.target.checked } : f
                          ));
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-medium">{field.name}</div>
                        <div className="text-xs text-gray-500">Type: {field.type}</div>
                        {field.isAI && <div className="text-xs text-blue-600">AI-Generated</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingField(field)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Settings2Icon className="h-4 w-4 text-gray-500" />
                      </button>
                      {field.id !== 'key_objective' && field.id !== 'relevance_score' && field.id !== 'citation_count' && (
                        <button
                          onClick={() => {
                            setCustomFields(customFields.filter(f => f.id !== field.id));
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <TrashIcon className="h-4 w-4 text-gray-500" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Add New Field */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Field</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Name
                  </label>
                  <Input
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="Enter field name"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Type
                  </label>
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="select">Single Select</option>
                    <option value="multi_select">Multi Select</option>
                    <option value="date">Date</option>
                    <option value="url">URL</option>
                  </select>
                </div>
                <Button
                  onClick={() => {
                    if (newFieldName.trim()) {
                      const newField: CustomField = {
                        id: newFieldName.toLowerCase().replace(/\s+/g, '_'),
                        name: newFieldName,
                        type: newFieldType as CustomField['type'],
                        enabled: true,
                        options: newFieldType === 'select' || newFieldType === 'multi_select' ? [] : undefined,
                        prompt: '',
                        isAI: false
                      };
                      setCustomFields([...customFields, newField]);
                      setNewFieldName('');
                      setNewFieldType('text');
                    }
                  }}
                  className="w-full"
                  disabled={!newFieldName.trim()}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="border-t pt-6 mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Quick Actions</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowFieldSettings(false);
                    setShowCreateConfigDialog(true);
                  }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <PlusIcon className="h-3 w-3 mr-1" />
                  Create New Config
                </Button>
              </div>
              
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Create custom configurations to save field combinations for different research types.
                </p>
              </div>

              <h3 className="text-sm font-medium text-gray-700 mb-3">Load Preset Configuration</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => {
                    setCustomFields([
                      { id: 'study_type', name: 'Study Type', type: 'multi_select', options: ['Clinical Trial', 'Observational Study', 'Case Report', 'Cohort Study', 'RCT', 'Meta-analysis'], enabled: true, prompt: 'Identify the type of clinical study based on the methodology described.', isAI: true },
                      { id: 'biomarker_selection', name: 'Biomarker Selection', type: 'text', enabled: true, prompt: 'What biomarkers are used for patient selection or stratification?', isAI: true },
                      { id: 'patient_population', name: 'Patient Population', type: 'text', enabled: true, prompt: 'Describe the patient population studied (age, condition, demographics).', isAI: true },
                      { id: 'sample_size', name: 'Sample Size', type: 'number', enabled: true, prompt: 'Extract the total number of participants in the study.', isAI: true },
                      { id: 'primary_outcome', name: 'Primary Outcome', type: 'text', enabled: true, prompt: 'What was the primary outcome measure of this study?', isAI: true },
                      { id: 'adverse_events', name: 'Key Adverse Events', type: 'text', enabled: true, prompt: 'List the most significant adverse events reported.', isAI: true },
                    ]);
                  }}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="font-medium">Clinical Research</div>
                  <div className="text-xs text-gray-500">Optimized for clinical trials and patient studies</div>
                </button>
                <button 
                  onClick={() => {
                    setCustomFields([
                      { id: 'research_focus', name: 'Research Focus', type: 'multi_select', options: ['Mechanism Study', 'Drug Discovery', 'Biomarker', 'Pathway Analysis', 'Genetics', 'Proteomics'], enabled: true, prompt: 'What is the primary research focus of this basic science paper?', isAI: true },
                      { id: 'target_pathway', name: 'Target/Pathway', type: 'text', enabled: true, prompt: 'What molecular target or pathway is being studied?', isAI: true },
                      { id: 'model_system', name: 'Model System', type: 'select', options: ['Cell Line', 'Mouse', 'Rat', 'Zebrafish', 'Drosophila', 'C. elegans', 'Human Tissue', 'In vitro', 'Ex vivo'], enabled: true, prompt: 'Identify the model system or organism used in this study.', isAI: true },
                      { id: 'key_techniques', name: 'Key Techniques', type: 'text', enabled: true, prompt: 'List the main experimental techniques used (e.g., Western blot, PCR, microscopy).', isAI: true },
                      { id: 'key_finding', name: 'Key Finding', type: 'text', enabled: true, prompt: 'What is the most significant finding or discovery?', isAI: true },
                      { id: 'therapeutic_relevance', name: 'Therapeutic Relevance', type: 'text', enabled: true, prompt: 'What is the potential therapeutic implication of this research?', isAI: true },
                    ]);
                  }}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="font-medium">Basic Science</div>
                  <div className="text-xs text-gray-500">Focus on molecular mechanisms and lab research</div>
                </button>
                <button 
                  onClick={() => {
                    setCustomFields([
                      { id: 'review_type', name: 'Review Type', type: 'select', options: ['Systematic Review', 'Meta-analysis', 'Narrative Review', 'Scoping Review', 'Umbrella Review'], enabled: true, prompt: 'Classify the type of review article.', isAI: true },
                      { id: 'research_question', name: 'Research Question', type: 'text', enabled: true, prompt: 'What is the main research question addressed by this review?', isAI: true },
                      { id: 'studies_included', name: 'Studies Included', type: 'number', enabled: true, prompt: 'How many studies were included in this review?', isAI: true },
                      { id: 'main_findings', name: 'Main Findings', type: 'text', enabled: true, prompt: 'Summarize the main findings or conclusions of this review.', isAI: true },
                      { id: 'evidence_quality', name: 'Evidence Quality', type: 'select', options: ['High', 'Moderate', 'Low', 'Very Low'], enabled: true, prompt: 'What is the overall quality of evidence based on GRADE or similar criteria?', isAI: true },
                      { id: 'clinical_implications', name: 'Clinical Implications', type: 'text', enabled: true, prompt: 'What are the clinical practice implications of this review?', isAI: true },
                    ]);
                  }}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="font-medium">Literature Review</div>
                  <div className="text-xs text-gray-500">Ideal for systematic reviews and meta-analyses</div>
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowFieldSettings(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => setShowFieldSettings(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    );
  };

    return (
    <main className="min-h-screen w-full bg-white text-gray-900 font-sans flex flex-col">
      <Header />
      <FieldSettingsModal />

      {/* PubMed Style Hero/Search Section */}
      <section className="relative bg-gradient-to-b from-blue-600 to-blue-700 text-white min-h-[250px] flex items-center overflow-hidden flex-shrink-0">
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
      <section className="w-full flex-1 flex overflow-hidden">
        {/* Fixed Filter Sidebar */}
        <div className="w-80 flex-shrink-0 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
          {(loading || (results && results.length > 0)) && (
              <>
                    {/* Apply/Reset Filters Bar */}
                    {!loading && (getPendingFiltersCount() > 0 || getActiveFiltersCount() > 0) && (
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
                    
                    {/* Filters */}
                    {loading ? (
                      <FilterSkeleton />
                    ) : (
                      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        
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
                          <button
                            onClick={() => toggleSection('type')}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <span className="font-medium text-sm">Article Type</span>
                            <div className="flex items-center gap-2">
                              {pendingTypes.length > 0 && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  {pendingTypes.length}
                                </span>
                              )}
                              {expandedSections.type ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                            </div>
                          </button>
                          {expandedSections.type && typeBreakdown && typeBreakdown.length > 0 && (
                            <div className="px-4 pb-4">
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
                            </div>
                          )}
                        </div>
                      </div>
                )}
              </>
                    )}
                  </div>
                </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Error State */}
            {error && (
              <div className="flex items-center justify-center h-64 text-red-600">
                <p>Error: {error}</p>
              </div>
            )}
            
            {/* Empty State */}
            {results && results.length === 0 && !loading && !error && (
              <div className="flex items-center justify-center h-64 text-gray-600">
                <p>No results found for your query.</p>
              </div>
            )}
            
            {/* Results Content */}
            {(loading || (results && results.length > 0)) && !error && (
              <>
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
                          <option value="display_name:asc">Title (A-Z)</option>
                          <option value="display_name:desc">Title (Z-A)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <button 
                          className="p-1 hover:bg-gray-200 rounded" 
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                        >
                          <ChevronLeftIcon className={`h-4 w-4 ${currentPage === 1 ? 'text-gray-400' : 'text-gray-600'}`} />
                        </button>
                        <span className="text-sm">Page</span>
                        <input
                          type="text"
                          value={currentPage}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (value > 0 && value <= totalPages) {
                              handlePageChange(value);
                            }
                          }}
                          className="w-12 px-2 py-1 text-sm border border-gray-300 rounded text-center"
                        />
                        <span className="text-sm">of {totalPages}</span>
                        <button 
                          className="p-1 hover:bg-gray-200 rounded"
                          disabled={currentPage === totalPages}
                          onClick={() => handlePageChange(currentPage + 1)}
                        >
                          <ChevronRightIcon className={`h-4 w-4 ${currentPage === totalPages ? 'text-gray-400' : 'text-gray-600'}`} />
                        </button>
                        <button 
                          className="p-1 hover:bg-gray-200 rounded ml-2"
                          disabled={currentPage === totalPages}
                          onClick={() => handlePageChange(totalPages)}
                        >
                          <svg className={`h-4 w-4 ${currentPage === totalPages ? 'text-gray-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  )}
                  
                {/* Results Table */}
                  {loading ? (
                    <div className="space-y-0 border-t">
                      {[...Array(10)].map((_, i) => (
                        <ResultSkeleton key={i} />
                      ))}
                    </div>
                  ) : (
                  <div className="relative">
                    {/* Configuration Bar */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium text-gray-700">AI-Extracted Fields</span>
                          <div className="flex items-center gap-2">
                                                        <select
                              className="text-sm border border-gray-300 rounded px-3 py-1 bg-white"
                              value={selectedConfig}
                              onChange={(e) => {
                                const newConfigId = e.target.value;
                                if (newConfigId === 'custom') {
                                  setShowCreateConfigDialog(true);
                                } else {
                                  handleConfigChange(newConfigId);
                                }
                              }}
                            >
                              {/* Default configurations */}
                              {availableConfigs.filter(c => c.visibility === 'default').map(config => (
                                <option key={config.id} value={config.id}>
                                  Default - {config.name}
                                </option>
                              ))}
                              
                              {/* Community configurations */}
                              {availableConfigs.filter(c => c.visibility === 'community').length > 0 && (
                                <optgroup label="Community">
                                  {availableConfigs.filter(c => c.visibility === 'community').map(config => (
                                    <option key={config.id} value={config.id}>
                                      {config.name}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              
                              {/* User's private configurations */}
                              {availableConfigs.filter(c => c.visibility === 'private' && c.user_id === userId).length > 0 && (
                                <optgroup label="My Configurations">
                                  {availableConfigs.filter(c => c.visibility === 'private' && c.user_id === userId).map(config => (
                                    <option key={config.id} value={config.id}>
                                      {config.name}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              
                              <option value="custom">+ Create New Configuration</option>
                            </select>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowFieldSettings(true)}
                            >
                              <Settings2Icon className="h-4 w-4 mr-2" />
                              Manage Fields
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                // If using a default config, prompt to create custom
                                if (currentConfig?.visibility === 'default') {
                                  if (confirm('You\'re using a default configuration. Would you like to create a custom configuration based on this one?')) {
                                    setConfigBuilder({
                                      name: `Custom ${currentConfig.name}`,
                                      fields: [...customFields]
                                    });
                                    setShowConfigBuilder(true);
                                  }
                                } else {
                                  setShowAddFieldDialog(true);
                                }
                              }}
                            >
                              <PlusIcon className="h-4 w-4 mr-2" />
                              Add Column
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {currentConfig?.user_id === userId && currentConfig?.visibility === 'private' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                try {
                                  await handleUpdateConfiguration(currentConfig.id, {
                                    fields: customFields
                                  });
                                  alert('Configuration saved successfully!');
                                } catch (error) {
                                  alert('Failed to save configuration');
                                }
                              }}
                              className="text-xs"
                            >
                              <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                              </svg>
                              Save Config
                            </Button>
                          )}
                          <div className="text-xs text-gray-500">
                            {customFields.filter(f => f.enabled).length} active fields
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Table with horizontal scroll */}
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-gray-300 bg-gray-50">
                            {/* Fixed columns */}
                            <th className="sticky left-0 z-10 bg-gray-50 text-left p-3 font-medium text-sm text-gray-700 w-[44px] border-r border-gray-200">
                              <input type="checkbox" className="rounded border-gray-300" />
                            </th>
                            <th className="sticky left-[44px] z-10 bg-gray-50 text-left p-3 font-medium text-sm text-gray-700 w-[48px] border-r border-gray-200">#</th>
                            <th className="sticky left-[92px] z-10 bg-gray-50 text-left p-3 font-medium text-sm text-gray-700 min-w-[400px] border-r border-gray-200">
                              Paper Details
                            </th>
                            <th className="sticky left-[492px] z-10 bg-gray-50 text-center p-3 font-medium text-sm text-gray-700 w-32 border-r border-gray-200">
                              Status
                            </th>
                            
                            {/* Scrollable AI columns */}
                            <th colSpan={customFields.filter(f => f.enabled).length} className="text-center p-2 bg-blue-50 border-b border-blue-200">
                              <div className="text-xs font-medium text-blue-700 uppercase tracking-wider">
                                AI-Extracted Fields
                              </div>
                            </th>
                          </tr>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            {/* Empty cells for fixed columns */}
                            <th className="sticky left-0 z-10 bg-gray-50 border-r border-gray-200 w-[44px]"></th>
                            <th className="sticky left-[44px] z-10 bg-gray-50 border-r border-gray-200 w-[48px]"></th>
                            <th className="sticky left-[92px] z-10 bg-gray-50 border-r border-gray-200 min-w-[400px]"></th>
                            <th className="sticky left-[492px] z-10 bg-gray-50 border-r border-gray-200 w-32"></th>
                            
                            {/* AI column headers */}
                            {customFields.filter(f => f.enabled).map(field => (
                              <th key={field.id} className="text-left p-3 font-medium text-sm text-gray-700 min-w-[200px] border-r border-gray-100 last:border-r-0">
                                <div className="flex items-center justify-between">
                                  <span>{field.name}</span>
                                  <button
                                    onClick={() => setEditingField(field)}
                                    className="p-1 hover:bg-gray-200 rounded opacity-50 hover:opacity-100 transition-opacity"
                                    title={`Configure ${field.name}`}
                                  >
                                    <Settings2Icon className="h-4 w-4 text-gray-500" />
                                  </button>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                      <tbody>
                        {results && results.map((result: any, index: number) => {
                          // Mock status for each paper
                          const statuses = [
                            { type: 'ingesting', text: 'Full text ingestion in progress' },
                            { type: 'extracting', text: 'Field extraction in progress' },
                            { type: 'done-full', text: 'Done (Full Text)' },
                            { type: 'done-abstract', text: 'Done (Title & Abstract Only)' },
                            { type: 'pending', text: 'Pending' },
                          ];
                          const status = statuses[Math.floor(Math.random() * statuses.length)];
                          
                          return (
                            <tr key={result.id} className="border-b border-gray-200 hover:bg-gray-50">
                              {/* Fixed columns */}
                              <td className="sticky left-0 z-10 bg-white p-3 border-r border-gray-200">
                                <input type="checkbox" className="rounded border-gray-300" />
                              </td>
                              <td className="sticky left-[44px] z-10 bg-white p-3 text-sm text-gray-500 border-r border-gray-200">
                                {(currentPage - 1) * 10 + index + 1}
                              </td>
                              <td className="sticky left-[92px] z-10 bg-white p-3 min-w-[400px] border-r border-gray-200">
                                <div className="space-y-1">
                              <a 
                                href="#"
                                    className="text-sm font-medium text-blue-700 hover:underline block"
                              >
                                {result.title}
                              </a>
                                  <div className="text-xs text-gray-600">
                                    {result.authorships?.slice(0, 3).map((auth: any) => auth.author.display_name).join(', ')}
                                    {result.authorships?.length > 3 && ', et al.'}
                            </div>
                                  <div className="text-xs text-gray-500">
                                    {result.primary_location?.source?.display_name || 'Unknown source'} • {result.publication_year}
                              {result.open_access?.is_oa && (
                                      <span className="ml-2 text-orange-600 font-medium">Open Access</span>
                              )}
                            </div>
                          </div>
                              </td>
                              <td className="sticky left-[492px] z-10 bg-white p-3 w-32 border-r border-gray-200">
                                <div className="flex items-center justify-center">
                                  <div className="relative group">
                                    {status.type === 'ingesting' || status.type === 'extracting' ? (
                                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                                    ) : status.type === 'done-full' ? (
                                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                                    ) : status.type === 'done-abstract' ? (
                                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                    ) : (
                                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                                    )}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                      {status.text}
                        </div>
                      </div>
                                </div>
                              </td>
                              
                              {/* Scrollable AI columns */}
                              {customFields.filter(f => f.enabled).map(field => (
                                <td key={field.id} className="p-3 border-r border-gray-100 last:border-r-0">
                                  <AIResponseCell field={field} result={result} />
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                </div>
              </div>
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

      {/* Add Field Dialog */}
      {showAddFieldDialog && (
        <div className={`fixed inset-0 bg-black bg-opacity-50 ${showConfigBuilder ? 'z-[60]' : 'z-50'} flex items-center justify-center p-4`}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add New Field</h3>
                <button
                  onClick={() => setShowAddFieldDialog(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Name
                </label>
                <Input
                  placeholder="e.g., Study Design"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value)}
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="boolean">Yes/No</option>
                  <option value="select">Single Select</option>
                  <option value="multi_select">Multi Select</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddFieldDialog(false);
                    setNewFieldName('');
                    setNewFieldType('text');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (newFieldName.trim()) {
                      const newField: CustomField = {
                        id: `custom_${Date.now()}`,
                        name: newFieldName,
                        type: newFieldType as CustomField['type'],
                        enabled: true,
                        prompt: '',
                        isAI: true,
                        options: newFieldType === 'select' || newFieldType === 'multi_select' ? [] : undefined
                      };
                      
                      // If we're in config builder mode, add to builder
                      if (showConfigBuilder) {
                        setConfigBuilder({
                          ...configBuilder,
                          fields: [...configBuilder.fields, newField]
                        });
                      } else {
                        // Otherwise add to current fields
                        setCustomFields([...customFields, newField]);
                      }
                      
                      setShowAddFieldDialog(false);
                      setNewFieldName('');
                      setNewFieldType('text');
                    }
                  }}
                  disabled={!newFieldName.trim()}
                >
                  Add Field
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Builder */}
      {showConfigBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{configBuilder.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">Add and configure fields for your custom configuration</p>
                </div>
                <button
                  onClick={() => {
                    setShowConfigBuilder(false);
                    setConfigBuilder({name: '', fields: []});
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {configBuilder.fields.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No fields yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding your first field.</p>
                  <div className="mt-6">
                    <Button
                      onClick={() => {
                        setShowAddFieldDialog(true);
                      }}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add First Field
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-900">Fields ({configBuilder.fields.length})</h4>
                    <Button
                      size="sm"
                      onClick={() => setShowAddFieldDialog(true)}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Field
                    </Button>
                  </div>
                  
                  {configBuilder.fields.map((field, index) => (
                    <div key={field.id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium text-gray-900">{field.name}</h5>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {field.type}
                            </span>
                            {field.isAI && (
                              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                AI-powered
                              </span>
                            )}
                          </div>
                          {field.prompt && (
                            <p className="text-sm text-gray-600 mt-1">{field.prompt}</p>
                          )}
                          {field.options && field.options.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-gray-500">Options: </span>
                              <span className="text-xs text-gray-700">{field.options.join(', ')}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => {
                              setEditingField(field);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              setConfigBuilder({
                                ...configBuilder,
                                fields: configBuilder.fields.filter(f => f.id !== field.id)
                              });
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Preview mode
                    alert('Preview coming soon!');
                  }}
                >
                  Preview
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowConfigBuilder(false);
                      setConfigBuilder({name: '', fields: []});
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        // Create and save the configuration
                        const newConfig = await handleCreateConfiguration(
                          configBuilder.name,
                          '',
                          configBuilder.fields,
                          'private'
                        );
                        setShowConfigBuilder(false);
                        setConfigBuilder({name: '', fields: []});
                      } catch (error) {
                        alert('Failed to create configuration');
                      }
                    }}
                    disabled={configBuilder.fields.length === 0 || !configBuilder.name}
                  >
                    Create & Use Configuration
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Configuration Dialog - Step 1: Choose Starting Point */}
      {showCreateConfigDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Create Custom Configuration</h3>
                  <p className="text-sm text-gray-600 mt-1">Choose how to start building your configuration</p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateConfigDialog(false);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Configuration Name
                  </label>
                  <Input
                    placeholder="e.g., Drug Discovery Screening"
                    value={configBuilder.name}
                    onChange={(e) => setConfigBuilder({...configBuilder, name: e.target.value})}
                    className="mb-6"
                  />
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">How would you like to start?</h4>
                  <div className="grid gap-3">
                    <button
                      onClick={() => {
                        setConfigBuilder({
                          name: configBuilder.name || 'My Configuration',
                          fields: []
                        });
                        setShowCreateConfigDialog(false);
                        setShowConfigBuilder(true);
                      }}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100">
                          <PlusIcon className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Start from scratch</div>
                          <div className="text-sm text-gray-600 mt-1">Build your configuration field by field</div>
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        const currentFields = currentConfig?.fields || [];
                        setConfigBuilder({
                          name: configBuilder.name || `Copy of ${currentConfig?.name || 'Configuration'}`,
                          fields: [...currentFields]
                        });
                        setShowCreateConfigDialog(false);
                        setShowConfigBuilder(true);
                      }}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100">
                          <svg className="h-5 w-5 text-gray-600 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Copy current configuration</div>
                          <div className="text-sm text-gray-600 mt-1">Start with the current fields and modify as needed</div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        // Show template selection
                        alert('Template library coming soon!');
                      }}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100">
                          <svg className="h-5 w-5 text-gray-600 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Use a template</div>
                          <div className="text-sm text-gray-600 mt-1">Choose from community-created templates</div>
                          <div className="text-xs text-blue-600 mt-1">Coming soon</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateConfigDialog(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!configBuilder.name) {
                      // Could add validation here
                      return;
                    }
                    setConfigBuilder({
                      name: configBuilder.name || 'My Configuration',
                      fields: []
                    });
                    setShowCreateConfigDialog(false);
                    setShowConfigBuilder(true);
                  }}
                  disabled={!configBuilder.name}
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
