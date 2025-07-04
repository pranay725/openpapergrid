import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DotGrid from "@/components/DotGrid";

interface SearchHeaderProps {
  initialQuery: string;
  query: string;
  loading: boolean;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({
  initialQuery,
  query,
  loading,
  onQueryChange,
  onSearch
}) => {
  return (
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
                onChange={(e) => onQueryChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    onSearch();
                  }
                }}
              />
              <Button
                size="lg"
                className="rounded-none rounded-r bg-blue-600 hover:bg-blue-700 text-white px-6 font-normal"
                onClick={onSearch}
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
  );
}; 