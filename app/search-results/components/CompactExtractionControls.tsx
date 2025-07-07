import React, { useState } from 'react';
import { 
  SparklesIcon, 
  XIcon, 
  ChevronDownIcon,
  Settings2Icon,
  PlusIcon,
  TrashIcon,
  EditIcon,
  MoreVerticalIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScreeningConfiguration, CustomField } from '@/lib/database.types';

export type ExtractionMode = 'abstract' | 'fulltext';

interface CompactExtractionControlsProps {
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
}

// AI Provider configuration
const AI_PROVIDERS = {
  openrouter: {
    models: [
      { id: 'openrouter/cypher-alpha:free', name: 'Cypher', short: 'Cypher' },
      { id: 'google/gemma-3n-e4b-it:free', name: 'Gemma 3n', short: 'Gemma' },
      { id: 'google/gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5', short: 'Gemini' },
      { id: 'openai/gpt-4.1', name: 'GPT-4.1', short: 'GPT-4' }
    ]
  }
};

export const CompactExtractionControls: React.FC<CompactExtractionControlsProps> = ({
  extractionMode,
  onModeChange,
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
  onDeleteConfig
}) => {
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const userConfigs = configurations.filter(c => c.visibility === 'private' && c.user_id === userId);
  const defaultConfigs = configurations.filter(c => c.visibility === 'default');

  const activeFieldCount = customFields.filter(f => f.enabled).length;
  
  // Get current model display name
  const currentModelInfo = AI_PROVIDERS.openrouter.models.find(m => m.id === selectedModel);
  const modelDisplayName = currentModelInfo?.short || 'AI';

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center h-12">
        {/* Configuration Section */}
        <div className="flex items-center pl-4 pr-2 border-r border-gray-200">
          <div className="relative">
            <button
              onClick={() => setShowConfigMenu(!showConfigMenu)}
              className="flex items-center gap-2 text-sm hover:bg-gray-50 rounded px-2 py-1 transition-colors"
            >
              <span className="font-medium">{currentConfig?.name || 'Select Config'}</span>
              <span className="text-xs text-gray-500">({activeFieldCount})</span>
              <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" />
            </button>
            
            {showConfigMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowConfigMenu(false)}
                />
                <div className="absolute left-0 top-full z-20 mt-1 w-80 bg-white rounded-md shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
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
            className="ml-1 p-1.5 hover:bg-gray-100 rounded"
            title="Manage Fields"
          >
            <Settings2Icon className="h-3.5 w-3.5 text-gray-500" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center px-3">
          <div className="inline-flex bg-gray-100 rounded-md p-0.5">
            <button
              onClick={() => onModeChange('abstract')}
              className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                extractionMode === 'abstract'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Abstract
            </button>
            <button
              onClick={() => onModeChange('fulltext')}
              className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                extractionMode === 'fulltext'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Full Text
            </button>
          </div>
        </div>

        {/* Options Menu (AI Model, etc) */}
        <div className="relative px-3 border-r border-gray-200">
          <button
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
          >
            <span>{modelDisplayName}</span>
            <MoreVerticalIcon className="h-3.5 w-3.5" />
          </button>
          
          {showOptionsMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowOptionsMenu(false)}
              />
              <div className="absolute left-0 top-full z-20 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200">
                <div className="p-3">
                  <div className="text-xs font-medium text-gray-500 mb-2">AI Model</div>
                  {AI_PROVIDERS.openrouter.models.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onProviderChange('openrouter', model.id);
                        setShowOptionsMenu(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${
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

        {/* Spacer */}
        <div className="flex-1" />

        {/* Extract Button */}
        <div className="pr-4">
          {isExtracting ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              className="h-8 gap-1.5"
            >
              <XIcon className="h-3.5 w-3.5" />
              Cancel
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onExtract}
              disabled={extractDisabled}
              className={`h-8 gap-1.5 ${
                hasExtracted 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              <SparklesIcon className="h-3.5 w-3.5" />
              {hasExtracted ? 'Re-extract' : 'Extract'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}; 