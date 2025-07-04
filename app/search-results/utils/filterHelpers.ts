import { SearchFilters } from '../types';

export const buildFilterUrl = (
  query: string,
  filters: Partial<SearchFilters>,
  page: number = 1,
  sort: string = 'relevance_score:desc'
): string => {
  let url = `/search-results?query=${encodeURIComponent(query)}`;
  
  if (page > 1) {
    url += `&page=${page}`;
  }
  
  if (sort !== 'relevance_score:desc') {
    url += `&sort=${encodeURIComponent(sort)}`;
  }
  
  if (filters.year && filters.year.length > 0) {
    url += `&year=${filters.year.join('|')}`;
  }
  
  if (filters.types && filters.types.length > 0) {
    url += `&types=${filters.types.join('|')}`;
  }
  
  if (filters.topics && filters.topics.length > 0) {
    url += `&topics=${filters.topics.join('|')}`;
  }
  
  if (filters.institutions && filters.institutions.length > 0) {
    url += `&institutions=${filters.institutions.join('|')}`;
  }
  
  if (filters.countries && filters.countries.length > 0) {
    url += `&countries=${filters.countries.join('|')}`;
  }
  
  if (filters.authors && filters.authors.length > 0) {
    url += `&authors=${filters.authors.join('|')}`;
  }
  
  if (filters.journals && filters.journals.length > 0) {
    url += `&journals=${filters.journals.join('|')}`;
  }
  
  if (filters.textAvailability && filters.textAvailability.length > 0) {
    url += `&textAvailability=${filters.textAvailability.join('|')}`;
  }
  
  return url;
};

export const buildApiUrl = (
  query: string,
  filters: Partial<SearchFilters>,
  page: number = 1,
  sort: string = 'relevance_score:desc'
): string => {
  let apiUrl = `/api/search?query=${encodeURIComponent(query)}&page=${page}&sort=${encodeURIComponent(sort)}`;
  
  if (filters.year && filters.year.length > 0) {
    apiUrl += `&year=${filters.year.join('|')}`;
  }
  
  if (filters.textAvailability && filters.textAvailability[0] === 'is_oa') {
    apiUrl += `&openAccess=true`;
  }
  
  if (filters.topics && filters.topics.length > 0) {
    apiUrl += `&topics=${filters.topics.join('|')}`;
  }
  
  if (filters.institutions && filters.institutions.length > 0) {
    apiUrl += `&institutions=${filters.institutions.join('|')}`;
  }
  
  if (filters.types && filters.types.length > 0) {
    apiUrl += `&types=${filters.types.join('|')}`;
  }
  
  if (filters.countries && filters.countries.length > 0) {
    apiUrl += `&countries=${filters.countries.join('|')}`;
  }
  
  if (filters.authors && filters.authors.length > 0) {
    apiUrl += `&authors=${filters.authors.join('|')}`;
  }
  
  if (filters.journals && filters.journals.length > 0) {
    apiUrl += `&journals=${filters.journals.join('|')}`;
  }
  
  if (filters.textAvailability && filters.textAvailability.length > 0) {
    apiUrl += `&textAvailability=${filters.textAvailability.join('|')}`;
  }
  
  return apiUrl;
};

export const getActiveFiltersCount = (filters: SearchFilters): number => {
  let count = 0;
  count += filters.year.length;
  count += filters.topics.length;
  count += filters.institutions.length;
  count += filters.types.length;
  count += filters.countries.length;
  count += filters.authors.length;
  count += filters.journals.length;
  if (filters.textAvailability.length > 0) count++;
  if (filters.dateRange) count++;
  return count;
};

export const getPendingFiltersCount = (pendingFilters: SearchFilters): number => {
  return getActiveFiltersCount(pendingFilters);
};

export const extractIdFromUrl = (url: string, prefix: string): string => {
  if (url.startsWith(prefix)) {
    return url.replace(prefix, '');
  }
  return url;
};

export const getTextAvailabilityLabel = (value: string): string => {
  switch (value) {
    case 'is_oa':
      return 'Open Access';
    case 'has_fulltext':
      return 'Has Full Text';
    case 'abstract_only':
      return 'Abstract Only';
    default:
      return '';
  }
}; 