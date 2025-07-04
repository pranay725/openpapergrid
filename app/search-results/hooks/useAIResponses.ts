import { useState, useCallback } from 'react';
import { CustomField } from '@/lib/database.types';
import { SearchResult, AIResponse } from '../types';

export const useAIResponses = (
  results: SearchResult[],
  customFields: CustomField[]
) => {
  const [aiResponses, setAiResponses] = useState<Record<string, AIResponse>>({});
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});

  // Update a specific AI response
  const updateAIResponse = useCallback((resultId: string, fieldId: string, response: AIResponse) => {
    const key = `${resultId}_${fieldId}`;
    setAiResponses(prev => ({
      ...prev,
      [key]: response
    }));
  }, []);

  // Update just the value (for manual edits)
  const updateFieldValue = useCallback((resultId: string, fieldId: string, value: any) => {
    const key = `${resultId}_${fieldId}`;
    setFieldValues(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Also update the AI response if it exists
    setAiResponses(prev => {
      const existing = prev[key];
      if (existing) {
        return {
          ...prev,
          [key]: {
            ...existing,
            value
          }
        };
      }
      return prev;
    });
  }, []);

  // Clear responses for a specific result
  const clearResultResponses = useCallback((resultId: string) => {
    setAiResponses(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        if (key.startsWith(`${resultId}_`)) {
          delete updated[key];
        }
      });
      return updated;
    });
    
    setFieldValues(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        if (key.startsWith(`${resultId}_`)) {
          delete updated[key];
        }
      });
      return updated;
    });
  }, []);

  return {
    aiResponses,
    fieldValues,
    updateFieldValue,
    updateAIResponse,
    clearResultResponses
  };
}; 