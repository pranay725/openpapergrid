import React, { useState } from 'react';
import { FilterIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { YearFilter } from './YearFilter';
import { GenericFilter } from './GenericFilter';
import { TextAvailabilityFilter } from './TextAvailabilityFilter';
import { SearchResult, FilterBreakdown } from '../../types';

interface FilterSidebarProps {
  filters: {
    selectedYear: string[];
    selectedJournal: string[];
    selectedAuthor: string[];
    selectedInstitution: string[];
    selectedConcept: string[];
    selectedCountry: string[];
    textAvailability: string[];
    dateRange: string;
  };
  pendingFilters: {
    pendingYear: string[];
    pendingJournal: string[];
    pendingAuthor: string[];
    pendingInstitution: string[];
    pendingConcept: string[];
    pendingCountry: string[];
    pendingTextAvailability: string[];
    pendingDateRange: string;
  };
  breakdowns: {
    yearBreakdown: FilterBreakdown[] | null;
    journalBreakdown: FilterBreakdown[] | null;
    authorBreakdown: FilterBreakdown[] | null;
    institutionBreakdown: FilterBreakdown[] | null;
    conceptBreakdown: FilterBreakdown[] | null;
    countryBreakdown: FilterBreakdown[] | null;
  };
  results: SearchResult[] | null;
  onFilterChange: (filterType: string, values: string[] | string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  pendingFilters,
  breakdowns,
  results,
  onFilterChange,
  onApplyFilters,
  onClearFilters
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['year']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const hasAnyChanges = 
    JSON.stringify(pendingFilters.pendingYear.sort()) !== JSON.stringify(filters.selectedYear.sort()) ||
    JSON.stringify(pendingFilters.pendingJournal.sort()) !== JSON.stringify(filters.selectedJournal.sort()) ||
    JSON.stringify(pendingFilters.pendingAuthor.sort()) !== JSON.stringify(filters.selectedAuthor.sort()) ||
    JSON.stringify(pendingFilters.pendingInstitution.sort()) !== JSON.stringify(filters.selectedInstitution.sort()) ||
    JSON.stringify(pendingFilters.pendingConcept.sort()) !== JSON.stringify(filters.selectedConcept.sort()) ||
    JSON.stringify(pendingFilters.pendingCountry.sort()) !== JSON.stringify(filters.selectedCountry.sort()) ||
    pendingFilters.pendingTextAvailability[0] !== filters.textAvailability[0];

  const hasAnyFilters = 
    pendingFilters.pendingYear.length > 0 ||
    pendingFilters.pendingJournal.length > 0 ||
    pendingFilters.pendingAuthor.length > 0 ||
    pendingFilters.pendingInstitution.length > 0 ||
    pendingFilters.pendingConcept.length > 0 ||
    pendingFilters.pendingCountry.length > 0 ||
    pendingFilters.pendingTextAvailability.length > 0;

  return (
    <aside className="w-64 bg-white border-r h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FilterIcon className="h-4 w-4 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
          </div>
          {hasAnyFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex-1 overflow-y-auto">
        {/* Year Filter */}
        <YearFilter
          yearBreakdown={breakdowns.yearBreakdown}
          selectedYear={filters.selectedYear}
          pendingYear={pendingFilters.pendingYear}
          dateRange={filters.dateRange}
          pendingDateRange={pendingFilters.pendingDateRange}
          expanded={expandedSections.has('year')}
          onToggle={() => toggleSection('year')}
          onYearChange={(years) => onFilterChange('pendingYear', years)}
          onDateRangeChange={(range) => onFilterChange('pendingDateRange', range)}
        />

        {/* Journal Filter */}
        <GenericFilter
          title="Journal"
          breakdown={breakdowns.journalBreakdown}
          selected={filters.selectedJournal}
          pending={pendingFilters.pendingJournal}
          expanded={expandedSections.has('journal')}
          showSearch={true}
          urlPrefix="https://openalex.org/S"
          onToggle={() => toggleSection('journal')}
          onChange={(values) => onFilterChange('pendingJournal', values)}
        />

        {/* Author Filter */}
        <GenericFilter
          title="Author"
          breakdown={breakdowns.authorBreakdown}
          selected={filters.selectedAuthor}
          pending={pendingFilters.pendingAuthor}
          expanded={expandedSections.has('author')}
          showSearch={true}
          urlPrefix="https://openalex.org/A"
          onToggle={() => toggleSection('author')}
          onChange={(values) => onFilterChange('pendingAuthor', values)}
        />

        {/* Institution Filter */}
        <GenericFilter
          title="Institution"
          breakdown={breakdowns.institutionBreakdown}
          selected={filters.selectedInstitution}
          pending={pendingFilters.pendingInstitution}
          expanded={expandedSections.has('institution')}
          showSearch={true}
          urlPrefix="https://openalex.org/I"
          onToggle={() => toggleSection('institution')}
          onChange={(values) => onFilterChange('pendingInstitution', values)}
        />

        {/* Country Filter */}
        <GenericFilter
          title="Country"
          breakdown={breakdowns.countryBreakdown}
          selected={filters.selectedCountry}
          pending={pendingFilters.pendingCountry}
          expanded={expandedSections.has('country')}
          showSearch={true}
          onToggle={() => toggleSection('country')}
          onChange={(values) => onFilterChange('pendingCountry', values)}
        />

        {/* Concept Filter */}
        <GenericFilter
          title="Concept"
          breakdown={breakdowns.conceptBreakdown}
          selected={filters.selectedConcept}
          pending={pendingFilters.pendingConcept}
          expanded={expandedSections.has('concept')}
          showSearch={true}
          urlPrefix="https://openalex.org/C"
          onToggle={() => toggleSection('concept')}
          onChange={(values) => onFilterChange('pendingConcept', values)}
        />

        {/* Text Availability Filter */}
        <TextAvailabilityFilter
          textAvailability={filters.textAvailability}
          pendingTextAvailability={pendingFilters.pendingTextAvailability}
          results={results}
          onChange={(values) => onFilterChange('pendingTextAvailability', values)}
        />
      </div>

      {/* Apply/Cancel Footer */}
      {hasAnyChanges && (
        <div className="p-4 border-t bg-gray-50">
          <div className="flex gap-2">
            <Button
              onClick={onApplyFilters}
              className="flex-1"
              size="sm"
            >
              Apply filters
            </Button>
            <Button
              onClick={() => {
                // Reset pending filters to current filters
                Object.keys(filters).forEach(key => {
                  const pendingKey = key.replace('selected', 'pending').replace('textAvailability', 'pendingTextAvailability').replace('dateRange', 'pendingDateRange');
                  if (pendingKey in pendingFilters) {
                    onFilterChange(pendingKey, filters[key as keyof typeof filters]);
                  }
                });
              }}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}; 