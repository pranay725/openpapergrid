import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from 'lucide-react';
import { FilterBreakdown } from '../../types';

interface YearFilterProps {
  yearBreakdown: FilterBreakdown[] | null;
  selectedYear: string[];
  pendingYear: string[];
  dateRange: string;
  pendingDateRange: string;
  expanded: boolean;
  onToggle: () => void;
  onYearChange: (years: string[]) => void;
  onDateRangeChange: (range: string) => void;
}

export const YearFilter: React.FC<YearFilterProps> = ({
  yearBreakdown,
  selectedYear,
  pendingYear,
  dateRange,
  pendingDateRange,
  expanded,
  onToggle,
  onYearChange,
  onDateRangeChange
}) => {
  const hasChanges = JSON.stringify(pendingYear.sort()) !== JSON.stringify(selectedYear.sort());

  const handleDateRangeSelect = (range: string) => {
    onDateRangeChange(range);
    const currentYear = new Date().getFullYear();
    
    if (range === '1') {
      onYearChange([currentYear.toString()]);
    } else if (range === '5') {
      const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
      onYearChange(years);
    } else if (range === '10') {
      const years = Array.from({ length: 10 }, (_, i) => (currentYear - i).toString());
      onYearChange(years);
    }
  };

  const handleCustomRange = (fromYear: number, toYear: number) => {
    if (fromYear && toYear && fromYear <= toYear) {
      const years = [];
      for (let y = fromYear; y <= toYear; y++) {
        years.push(y.toString());
      }
      onYearChange(years);
    }
  };

  return (
    <div className="border-b relative">
      {hasChanges && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400"></div>
      )}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-sm">Year</span>
        <div className="flex items-center gap-2">
          {pendingYear.length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {pendingYear.length}
            </span>
          )}
          {expanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
        </div>
      </button>
      
      {expanded && yearBreakdown && yearBreakdown.length > 0 && (
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
                    onYearChange([]);
                    onDateRangeChange('');
                  }}
                  disabled={pendingYear.length === 0 && !pendingDateRange}
                >
                  Clear
                </button>
              </div>
              <div className="relative">
                <div className="flex items-end gap-0.5 h-24 mb-1">
                  {(() => {
                    const sortedYears = [...yearBreakdown]
                      .sort((a, b) => parseInt(a.key) - parseInt(b.key))
                      .slice(-25);
                    const maxCount = Math.max(...sortedYears.map((y) => y.count));
                    
                    return sortedYears.map((item) => {
                      const height = (item.count / maxCount) * 100;
                      const isSelected = pendingYear.includes(item.key);
                      return (
                        <button
                          key={item.key}
                          onClick={() => {
                            if (pendingYear.includes(item.key)) {
                              onYearChange(pendingYear.filter(y => y !== item.key));
                            } else {
                              onYearChange([...pendingYear, item.key]);
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
                  onChange={(e) => handleDateRangeSelect(e.target.value)}
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
                  onChange={(e) => handleDateRangeSelect(e.target.value)}
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
                  onChange={(e) => handleDateRangeSelect(e.target.value)}
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
                  onChange={(e) => onDateRangeChange(e.target.value)}
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
                        const toInput = e.target.nextElementSibling as HTMLInputElement;
                        const toYear = parseInt(toInput?.value || new Date().getFullYear().toString());
                        handleCustomRange(fromYear, toYear);
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
                        const fromInput = e.target.previousElementSibling as HTMLInputElement;
                        const fromYear = parseInt(fromInput?.value || '1900');
                        handleCustomRange(fromYear, toYear);
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
  );
}; 