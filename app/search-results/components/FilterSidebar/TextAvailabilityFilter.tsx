import React from 'react';
import { SearchResult } from '../../types';

interface TextAvailabilityFilterProps {
  textAvailability: string[];
  pendingTextAvailability: string[];
  results: SearchResult[] | null;
  onChange: (value: string[]) => void;
}

export const TextAvailabilityFilter: React.FC<TextAvailabilityFilterProps> = ({
  textAvailability,
  pendingTextAvailability,
  results,
  onChange
}) => {
  const hasChanges = pendingTextAvailability[0] !== textAvailability[0];
  
  const openAccessPercentage = results && results.length > 0
    ? Math.round((results.filter((r) => r.open_access?.is_oa).length / results.length) * 100)
    : 0;

  return (
    <div className="border-b relative">
      {hasChanges && (
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
              onChange={() => onChange([])}
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
              onChange={() => onChange(['is_oa'])}
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
              onChange={() => onChange(['has_fulltext'])}
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
              onChange={() => onChange(['abstract_only'])}
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
                    style={{ width: `${openAccessPercentage}%` }}
                  />
                </div>
                <span className="font-medium text-gray-700">
                  {openAccessPercentage}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 