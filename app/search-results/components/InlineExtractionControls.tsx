import React, { useState } from 'react';
import { 
  SparklesIcon, 
  XIcon, 
  ChevronDownIcon,
  Settings2Icon,
  PlusIcon,
  TrashIcon,
  EditIcon,
  LockIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScreeningConfiguration, CustomField } from '@/lib/database.types';
import { useRouter } from 'next/navigation';

export type ExtractionMode = 'abstract' | 'fulltext';

interface InlineExtractionControlsProps {
  // Extraction props
  extractionMode: ExtractionMode;
  onModeChange: (mode: ExtractionMode) => void;
  selectedProvider: string;
  selectedModel: string;
  onProviderChange: (provider: string, model: string) => void;
  isExtracting: boolean;
  hasExtracted: boolean;
  onExtract: () => void;
  onCancel: () => void;
  extractDisabled?: boolean;
  
  // Configuration props
  configurations: ScreeningConfiguration[];
  currentConfig: ScreeningConfiguration | null;
  selectedConfig: string;
  customFields: CustomField[];
  userId: string;
  onConfigChange: (configId: string) => void;
  onManageFields: () => void;
  onEditConfig?: (config: ScreeningConfiguration) => void;
  onDeleteConfig?: (configId: string) => void;
  
  // Results props
  totalResults: number;
  sortBy: string;
  onSortChange: (sort: string) => void;
  
  // Auth
  isAuthenticated?: boolean;
}

// AI Provider configuration
const AI_PROVIDERS = {
  openrouter: {
    models: [
      { id: 'openrouter/cypher-alpha:free', name: 'Cypher Alpha (free)', short: 'Cypher' },
      { id: 'google/gemma-3n-e4b-it:free', name: 'Google: Gemma 3n (free)', short: 'Gemma' },
      { id: 'google/gemini-2.5-flash-preview-05-20', name: 'Google: Gemini 2.5', short: 'Gemini' },
      { id: 'openai/gpt-4.1', name: 'OpenAI: GPT-4.1', short: 'GPT-4' }
    ]
  }
};

export const InlineExtractionControls: React.FC<InlineExtractionControlsProps> = ({
  extractionMode,
  onModeChange,
  selectedProvider,
  selectedModel,
  onProviderChange,
  isExtracting,
  hasExtracted,
  onExtract,
  onCancel,
  extractDisabled = false,
  configurations,
  currentConfig,
  selectedConfig,
  customFields,
  userId,
  onConfigChange,
  onManageFields,
  onEditConfig,
  onDeleteConfig,
  totalResults,
  sortBy,
  onSortChange,
  isAuthenticated = false
}) => {
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const router = useRouter();

  const userConfigs = configurations.filter(c => c.visibility === 'private' && c.user_id === userId);
  const defaultConfigs = configurations.filter(c => c.visibility === 'default');
  const activeFieldCount = customFields.filter(f => f.enabled).length;
  
  // Get current model display name
  const currentModelInfo = AI_PROVIDERS.openrouter.models.find(m => m.id === selectedModel);
  const modelDisplayName = currentModelInfo?.short || 'AI';
  
  // Check if full text is disabled for anonymous users
  const fullTextDisabled = extractionMode === 'fulltext' && !isAuthenticated;

  return (
    <div className="flex items-stretch justify-between gap-6 mb-6 px-6 py-3 bg-gray-50 border-y border-gray-200">
      {/* Left side - Results count and sort */}
      <div className="flex items-end gap-6">
        <div className="flex flex-col justify-between h-full">
          <div className="text-xs text-gray-500 mb-1.5">Results</div>
          <div className="text-sm font-semibold text-gray-900 leading-8 flex items-center h-8">
            {totalResults.toLocaleString()}
          </div>
        </div>
        
        <div className="flex flex-col justify-between h-full">
          <label className="text-xs text-gray-500 mb-1.5">Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 h-8 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
          >
            <option value="relevance_score:desc">Best Match</option>
            <option value="publication_date:desc">Most Recent</option>
            <option value="publication_date:asc">Oldest First</option>
            <option value="cited_by_count:desc">Most Cited</option>
            <option value="cited_by_count:asc">Least Cited</option>
          </select>
        </div>
      </div>

      {/* Right side - Extraction controls */}
      <div className="flex items-end gap-4">
        {/* Configuration */}
        <div className="flex flex-col justify-between h-full">
          <div className="text-xs text-gray-500 mb-1.5">Screening Fields Configuration</div>
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => setShowConfigMenu(!showConfigMenu)}
                className="flex items-center gap-2 text-sm border border-gray-300 rounded-md px-3 py-1.5 h-8 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <span className="font-medium text-gray-900">{currentConfig?.name || 'Select'}</span>
                <span className="text-xs text-gray-500">({activeFieldCount})</span>
                <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" />
              </button>
              
              {showConfigMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowConfigMenu(false)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
                    {/* Default Configurations */}
                    {defaultConfigs.length > 0 && (
                      <div>
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">Default</div>
                        {defaultConfigs.map(config => (
                          <button
                            key={config.id}
                            onClick={() => {
                              onConfigChange(config.id);
                              setShowConfigMenu(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between ${
                              selectedConfig === config.id ? 'bg-blue-50 text-blue-700' : ''
                            }`}
                          >
                            <span>{config.name}</span>
                            <span className="text-xs text-gray-500">{config.fields.filter(f => f.enabled).length} fields</span>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* User Configurations */}
                    {userConfigs.length > 0 && (
                      <div>
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">My Configurations</div>
                        {userConfigs.map(config => (
                          <div
                            key={config.id}
                            className={`px-3 py-2 hover:bg-gray-100 ${
                              selectedConfig === config.id ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => {
                                  onConfigChange(config.id);
                                  setShowConfigMenu(false);
                                }}
                                className="flex-1 text-left text-sm"
                              >
                                <span className={selectedConfig === config.id ? 'text-blue-700' : ''}>{config.name}</span>
                              </button>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditConfig?.(config);
                                    setShowConfigMenu(false);
                                  }}
                                  className="p-1 hover:bg-gray-200 rounded"
                                  title="Edit"
                                >
                                  <EditIcon className="h-3 w-3 text-gray-600" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Delete configuration "${config.name}"?`)) {
                                      onDeleteConfig?.(config.id);
                                    }
                                  }}
                                  className="p-1 hover:bg-gray-200 rounded"
                                  title="Delete"
                                >
                                  <TrashIcon className="h-3 w-3 text-red-600" />
                                </button>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {config.fields.filter(f => f.enabled).length} fields
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Create New Option */}
                    <div className="border-t border-gray-200">
                      <button
                        onClick={() => {
                          onConfigChange('custom');
                          setShowConfigMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-blue-600"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Create New Configuration
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <button
              onClick={onManageFields}
              className="flex items-center justify-center w-8 h-8 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              title="Manage Fields"
            >
              <Settings2Icon className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex flex-col justify-between h-full">
          <div className="text-xs text-gray-500 mb-1.5">Extract Source</div>
          <div className="inline-flex bg-gray-100 rounded-md p-1 h-8">
            <button
              onClick={() => onModeChange('abstract')}
              className={`px-3 text-xs font-medium rounded transition-all ${
                extractionMode === 'abstract'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Abstract
            </button>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  // Show sign in prompt
                  if (confirm('Full text extraction requires sign in. Would you like to sign in now?')) {
                    router.push('/auth/login?redirectTo=/search-results');
                  }
                } else {
                  onModeChange('fulltext');
                }
              }}
              className={`px-3 text-xs font-medium rounded transition-all flex items-center gap-1 ${
                extractionMode === 'fulltext'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {!isAuthenticated && <LockIcon className="h-3 w-3" />}
              Full Text
            </button>
          </div>
        </div>

        {/* AI Model */}
        <div className="flex flex-col justify-between h-full">
          <div className="text-xs text-gray-500 mb-1.5">Extraction Model</div>
          <div className="relative">
            <button
              onClick={() => setShowModelMenu(!showModelMenu)}
              className="flex items-center gap-2 text-sm border border-gray-300 rounded-md px-3 py-1.5 h-8 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <span className="font-medium text-gray-900">{modelDisplayName}</span>
              <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" />
            </button>
            
            {showModelMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowModelMenu(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200">
                  <div className="p-2">
                    {AI_PROVIDERS.openrouter.models.map(model => (
                      <button
                        key={model.id}
                        onClick={() => {
                          onProviderChange('openrouter', model.id);
                          setShowModelMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${
                          selectedModel === model.id ? 'bg-blue-50 text-blue-700' : ''
                        }`}
                      >
                        {model.name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Extract Button */}
        <div className="flex flex-col justify-between h-full">
          <div className="text-xs text-gray-500 mb-1.5 invisible">Action</div>
          {fullTextDisabled ? (
            <Button
              size="sm"
              onClick={() => router.push('/auth/login?redirectTo=/search-results')}
              className="h-8 px-4 gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <LockIcon className="h-3.5 w-3.5" />
              Sign In to Extract
            </Button>
          ) : isExtracting ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              className="h-8 px-4 gap-2 border-gray-300"
            >
              <XIcon className="h-3.5 w-3.5" />
              Cancel
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onExtract}
              disabled={extractDisabled}
              className={`h-8 px-4 gap-2 ${
                hasExtracted 
                  ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              } text-white border-0 focus:outline-none focus:ring-2`}
            >
              <SparklesIcon className="h-3.5 w-3.5" />
              Extract
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}; 