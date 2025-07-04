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
    id: 'openai',
    name: 'OpenAI',
    models: [
      { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo', description: 'Most capable, higher cost' },
      { id: 'gpt-4', name: 'GPT-4', description: 'Very capable, moderate cost' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and affordable' }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: [
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most capable' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Balanced performance' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fast and efficient' }
    ]
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    models: [
      { id: 'openrouter/cypher-alpha:free', name: 'Cypher Alpha', description: '🆓 Free model!' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Latest and most capable' },
      { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', description: 'Very capable' },
      { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced' },
      { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fast' },
      { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', description: 'OpenAI\'s best' },
      { id: 'openai/gpt-4', name: 'GPT-4', description: 'Very capable' },
      { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cheap' },
      { id: 'google/gemini-pro-1.5', name: 'Gemini 1.5 Pro', description: 'Google\'s latest' },
      { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', description: 'Open source, large' },
      { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', description: 'Open source, fast' },
      { id: 'mistralai/mistral-large', name: 'Mistral Large', description: 'European alternative' },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', description: 'Cost effective' }
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