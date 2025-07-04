import { useState, useCallback } from 'react';
import { SearchFilters } from '../types';
import { getActiveFiltersCount, getPendingFiltersCount } from '../utils/filterHelpers';

interface UseSearchFiltersReturn {
  filters: SearchFilters;
  pendingFilters: SearchFilters;
  counts: {
    active: number;
    pending: number;
  };
  actions: {
    updateFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
    updatePendingFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
    applyFilters: () => void;
    resetFilters: () => void;
    clearFilters: () => void;
  };
}

export const useSearchFilters = (initialFilters: Partial<SearchFilters> = {}): UseSearchFiltersReturn => {
  const defaultFilters: SearchFilters = {
    year: [],
    topics: [],
    institutions: [],
    types: [],
    countries: [],
    authors: [],
    journals: [],
    textAvailability: [],
    dateRange: '',
    ...initialFilters
  };

  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [pendingFilters, setPendingFilters] = useState<SearchFilters>(defaultFilters);

  const updateFilter = useCallback(<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const updatePendingFilter = useCallback(<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const applyFilters = useCallback(() => {
    setFilters(pendingFilters);
  }, [pendingFilters]);

  const resetFilters = useCallback(() => {
    setPendingFilters(filters);
  }, [filters]);

  const clearFilters = useCallback(() => {
    const cleared: SearchFilters = {
      year: [],
      topics: [],
      institutions: [],
      types: [],
      countries: [],
      authors: [],
      journals: [],
      textAvailability: [],
      dateRange: ''
    };
    setFilters(cleared);
    setPendingFilters(cleared);
  }, []);

  return {
    filters,
    pendingFilters,
    counts: {
      active: getActiveFiltersCount(filters),
      pending: getPendingFiltersCount(pendingFilters)
    },
    actions: {
      updateFilter,
      updatePendingFilter,
      applyFilters,
      resetFilters,
      clearFilters
    }
  };
}; 