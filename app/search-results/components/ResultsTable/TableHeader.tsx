import React from 'react';
import { Settings2Icon } from 'lucide-react';
import { CustomField } from '@/lib/database.types';

interface TableHeaderProps {
  customFields: CustomField[];
  onFieldEdit?: (field: CustomField) => void;
}

export const TableHeader: React.FC<TableHeaderProps> = ({ customFields, onFieldEdit }) => {
  return (
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
                onClick={() => onFieldEdit?.(field)}
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
  );
}; 