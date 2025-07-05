import React from 'react';
import { ChevronDownIcon } from 'lucide-react';

export interface AIProvider {
  id: string;
  name: string;
  models: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
}

const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    models: [
      { id: 'openrouter/cypher-alpha:free', name: 'Cypher Alpha (free)', description: '🆓 Free model' },
      { id: 'google/gemma-3n-e4b-it:free', name: 'Google: Gemma 3n 4B (free)', description: '🆓 Free model' },
      { id: 'google/gemini-2.5-flash-preview-05-20', name: 'Google: Gemini 2.5 Flash Preview 05-20', description: 'Latest Gemini' },
      { id: 'openai/gpt-4.1', name: 'OpenAI: GPT-4.1', description: 'Latest GPT-4' }
    ]
  }
];

interface AIProviderSelectorProps {
  selectedProvider: string;
  selectedModel: string;
  onProviderChange: (provider: string, model: string) => void;
  className?: string;
}

export const AIProviderSelector: React.FC<AIProviderSelectorProps> = ({
  selectedProvider,
  selectedModel,
  onProviderChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const currentProvider = AI_PROVIDERS.find(p => p.id === selectedProvider);
  const currentModel = currentProvider?.models.find(m => m.id === selectedModel);
  
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="text-left">
          <div className="font-medium">{currentProvider?.name || 'Select Provider'}</div>
          {currentModel && (
            <div className="text-xs text-gray-500">{currentModel.name}</div>
          )}
        </div>
        <ChevronDownIcon className="h-4 w-4 text-gray-400" />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-72 bg-white rounded-md shadow-lg border border-gray-200">
            {AI_PROVIDERS.map(provider => (
              <div key={provider.id} className="border-b border-gray-100 last:border-b-0">
                <div className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50">
                  {provider.name}
                </div>
                <div className="py-1">
                  {provider.models.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onProviderChange(provider.id, model.id);
                        setIsOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${
                        selectedProvider === provider.id && selectedModel === model.id
                          ? 'bg-blue-50 text-blue-700'
                          : ''
                      }`}
                    >
                      <div className="text-sm font-medium">{model.name}</div>
                      {model.description && (
                        <div className="text-xs text-gray-500">{model.description}</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}; 