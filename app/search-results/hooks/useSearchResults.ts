import { useState, useCallback } from 'react';
import { SearchResult, FilterBreakdown } from '../types';
import { buildApiUrl } from '../utils/filterHelpers';

interface UseSearchResultsReturn {
  results: SearchResult[] | null;
  totalResults: number;
  loading: boolean;
  error: string | null;
  yearBreakdown: FilterBreakdown[] | null;
  typeBreakdown: FilterBreakdown[] | null;
  topicBreakdown: FilterBreakdown[] | null;
  institutionBreakdown: FilterBreakdown[] | null;
  countryBreakdown: FilterBreakdown[] | null;
  authorBreakdown: FilterBreakdown[] | null;
  journalBreakdown: FilterBreakdown[] | null;
  fetchResults: (query: string, filters: any, page: number, sort: string) => Promise<void>;
}

export const useSearchResults = (): UseSearchResultsReturn => {
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Breakdown states
  const [yearBreakdown, setYearBreakdown] = useState<FilterBreakdown[] | null>(null);
  const [typeBreakdown, setTypeBreakdown] = useState<FilterBreakdown[] | null>(null);
  const [topicBreakdown, setTopicBreakdown] = useState<FilterBreakdown[] | null>(null);
  const [institutionBreakdown, setInstitutionBreakdown] = useState<FilterBreakdown[] | null>(null);
  const [countryBreakdown, setCountryBreakdown] = useState<FilterBreakdown[] | null>(null);
  const [authorBreakdown, setAuthorBreakdown] = useState<FilterBreakdown[] | null>(null);
  const [journalBreakdown, setJournalBreakdown] = useState<FilterBreakdown[] | null>(null);

  const fetchResults = useCallback(async (
    query: string,
    filters: any,
    page: number = 1,
    sort: string = 'relevance_score:desc'
  ) => {
    if (!query) return;

    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = buildApiUrl(query, filters, page, sort);
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

  return {
    results,
    totalResults,
    loading,
    error,
    yearBreakdown,
    typeBreakdown,
    topicBreakdown,
    institutionBreakdown,
    countryBreakdown,
    authorBreakdown,
    journalBreakdown,
    fetchResults
  };
}; 