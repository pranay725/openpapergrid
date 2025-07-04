import type { ScreeningConfiguration, CustomField } from '@/lib/database.types';

// Re-export types that are used in other files
export type { CustomField } from '@/lib/database.types';

// Search and Filter Types
export interface SearchFilters {
  year: string[];
  topics: string[];
  institutions: string[];
  types: string[];
  countries: string[];
  authors: string[];
  journals: string[];
  textAvailability: string[];
  dateRange: string;
}

export interface FilterBreakdown {
  key: string;
  key_display_name?: string;
  count: number;
}

// Result Types
export interface SearchResult {
  id: string;
  title: string;
  abstract?: string;
  doi?: string;
  ids?: {
    pmid?: string;
    pmcid?: string;
    doi?: string;
    openalex?: string;
  };
  authorships?: Array<{
    author: {
      display_name: string;
    };
  }>;
  publication_year?: number;
  primary_location?: {
    source?: {
      display_name: string;
    };
  };
  open_access?: {
    is_oa: boolean;
    oa_url?: string;
  };
  cited_by_count?: number;
  relevance_score?: number;
}

export interface PaperStatus {
  type: 'ingesting' | 'extracting' | 'done-full' | 'done-abstract' | 'pending';
  text: string;
}

// AI Response Types
export interface AIResponse {
  value: any;
  confidence: number;
  citations: Array<{
    text: string;
    location: string;
  }>;
}

// Component Props Types
export interface SearchResultsClientProps {
  configurations: ScreeningConfiguration[];
  activeConfig: ScreeningConfiguration | null;
  userId: string;
}

export interface ConfigurationBuilderState {
  name: string;
  fields: CustomField[];
}

// Filter Section Types
export interface ExpandedSections {
  year: boolean;
  topic: boolean;
  institution: boolean;
  type: boolean;
  country: boolean;
  author: boolean;
  journal: boolean;
}

export interface ShowMoreState {
  topic: number;
  institution: number;
  country: number;
  author: number;
  journal: number;
}

export interface FilterSearchState {
  institution: string;
  author: string;
  journal: string;
} 