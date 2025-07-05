import React, { useState } from 'react';
import { FileTextIcon, RefreshCw } from 'lucide-react';
import { CustomField } from '@/lib/database.types';
import { AIResponse, SearchResult } from '../../types';

interface AIResponseCellProps {
  field: CustomField;
  result: SearchResult;
  aiResponse?: AIResponse;
  isExtracting?: boolean;
  onValueChange?: (value: any) => void;
  onRefreshField?: () => void;
}

export const AIResponseCell: React.FC<AIResponseCellProps> = ({ 
  field, 
  result, 
  aiResponse,
  isExtracting = false,
  onValueChange,
  onRefreshField
}) => {
  const [showCitations, setShowCitations] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  
  if (!aiResponse) {
    return (
      <div className="bg-gray-50 rounded-md p-2">
        <div className="text-sm text-gray-400 italic">
          {field.isAI ? 'Awaiting extraction...' : 'No data'}
        </div>
      </div>
    );
  }
  
  const confidenceLevel = aiResponse.confidence > 0.9 ? 'High' : 
                         aiResponse.confidence > 0.7 ? 'Medium' : 
                         aiResponse.confidence > 0.5 ? 'Low' : 'Unknown';
  
  const confidenceColor = {
    'High': 'text-green-600 bg-green-50',
    'Medium': 'text-yellow-600 bg-yellow-50',
    'Low': 'text-orange-600 bg-orange-50',
    'Unknown': 'text-gray-600 bg-gray-50'
  }[confidenceLevel];
  
  // Show streaming indicator if confidence is low and we're extracting
  const isStreaming = isExtracting && aiResponse.confidence <= 0.5;
  
  const handleSaveEdit = () => {
    setIsEditing(false);
    onValueChange?.(editValue);
  };
  
  const renderValue = () => {
    if (isEditing) {
      return (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSaveEdit();
            }
          }}
          className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      );
    }
    
    if (field.type === 'multi_select' && Array.isArray(aiResponse.value)) {
      return (
        <div className="text-sm text-gray-900">
          {aiResponse.value.join(', ')}
        </div>
      );
    }
    
    if (field.type === 'boolean') {
      return (
        <div className="text-sm text-gray-900">
          {aiResponse.value ? 'Yes' : 'No'}
        </div>
      );
    }
    
    if (!aiResponse.value || aiResponse.value === '') {
      return <span className="text-sm text-gray-400 italic">Empty</span>;
    }
    
    return <div className="text-sm text-gray-900">{aiResponse.value}</div>;
  };
  
  return (
    <div className={`rounded-md p-2 transition-colors ${isStreaming ? 'bg-blue-50 animate-pulse' : 'bg-gray-50 hover:bg-gray-100'}`}>
      <div 
        className="cursor-pointer"
        onClick={() => {
          if (!isEditing && !isStreaming) {
            setEditValue(Array.isArray(aiResponse.value) ? aiResponse.value.join(', ') : aiResponse.value || '');
            setIsEditing(true);
          }
        }}
      >
        {renderValue()}
      </div>
      
      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center gap-1">
          {isStreaming ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-blue-600 bg-blue-100">
              <span className="w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse"></span>
              Extracting...
            </span>
          ) : (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${confidenceColor}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current mr-1"></span>
              {confidenceLevel}
            </span>
          )}
        </div>
        
        {aiResponse.citations && aiResponse.citations.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCitations(!showCitations);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <FileTextIcon className="h-3 w-3" />
            {aiResponse.citations.length} source{aiResponse.citations.length !== 1 ? 's' : ''}
          </button>
        )}
        
        {/* Refresh field button */}
        {onRefreshField && !isStreaming && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRefreshField();
            }}
            className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
            title="Re-extract this field"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        )}
      </div>
      
      {showCitations && aiResponse.citations && aiResponse.citations.length > 0 && (
        <div className="mt-2 p-2 bg-white border border-gray-200 rounded text-xs">
          {aiResponse.citations.map((citation, idx) => (
            <div key={idx} className="mb-1 last:mb-0">
              <div className="text-gray-700">{citation.text}</div>
              <div className="text-gray-500 text-xs mt-0.5">{citation.location}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 