import React, { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FilterBreakdown } from '../../types';
import { extractIdFromUrl } from '../../utils/filterHelpers';

interface GenericFilterProps {
  title: string;
  breakdown: FilterBreakdown[] | null;
  selected: string[];
  pending: string[];
  expanded: boolean;
  showSearch?: boolean;
  urlPrefix?: string;
  onToggle: () => void;
  onChange: (values: string[]) => void;
  displayNameOverrides?: Record<string, string>;
}

export const GenericFilter: React.FC<GenericFilterProps> = ({
  title,
  breakdown,
  selected,
  pending,
  expanded,
  showSearch = false,
  urlPrefix,
  onToggle,
  onChange,
  displayNameOverrides = {}
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showMore, setShowMore] = useState(50);
  
  const hasChanges = JSON.stringify(pending.sort()) !== JSON.stringify(selected.sort());

  const getItemKey = (item: FilterBreakdown): string => {
    if (urlPrefix && item.key.startsWith(urlPrefix)) {
      return extractIdFromUrl(item.key, urlPrefix);
    }
    return item.key;
  };

  const getDisplayName = (item: FilterBreakdown): string => {
    const key = getItemKey(item);
    if (displayNameOverrides[key]) {
      return displayNameOverrides[key];
    }
    return item.key_display_name || key;
  };

  const filteredItems = breakdown ? (
    searchTerm
      ? breakdown.filter((item) => 
          getDisplayName(item).toLowerCase().includes(searchTerm.toLowerCase())
        )
      : breakdown
  ) : [];

  const itemsToShow = filteredItems.slice(0, showMore);

  return (
    <div className="border-b relative">
      {hasChanges && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400"></div>
      )}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-sm">{title}</span>
        <div className="flex items-center gap-2">
          {pending.length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {pending.length}
            </span>
          )}
          {expanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
        </div>
      </button>
      
      {expanded && breakdown && breakdown.length > 0 && (
        <div className="px-4 pb-4">
          {showSearch && breakdown.length > 10 && (
            <Input
              type="search"
              placeholder={`Search ${title.toLowerCase()}...`}
              className="mb-2 h-8 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          )}
          
          <div className="space-y-1 max-h-60 overflow-y-auto pr-2 -mr-2">
            {itemsToShow.map((item) => {
              const itemKey = getItemKey(item);
              const displayName = getDisplayName(item);
              const isSelected = pending.includes(itemKey) || pending.includes(item.key);
              
              return (
                <label 
                  key={item.key} 
                  className="flex items-start gap-2 text-sm py-1 cursor-pointer hover:bg-gray-50 px-1 -mx-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {
                      const valueToUse = urlPrefix ? item.key : itemKey;
                      if (pending.includes(valueToUse)) {
                        onChange(pending.filter(v => v !== valueToUse));
                      } else {
                        onChange([...pending, valueToUse]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span 
                        className={`${isSelected ? 'font-semibold text-blue-600' : 'text-gray-700'} break-words`}
                        title={displayName}
                      >
                        {displayName}
                      </span>
                      <span className="text-gray-500 text-xs flex-shrink-0 ml-1">
                        {item.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
          
          {filteredItems.length > showMore && (
            <button
              onClick={() => setShowMore(showMore + 50)}
              className="text-xs text-blue-600 hover:text-blue-700 mt-2"
            >
              Show more ({filteredItems.length - showMore} more)
            </button>
          )}
        </div>
      )}
    </div>
  );
}; 