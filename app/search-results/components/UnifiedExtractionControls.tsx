import React, { useState } from 'react';
import { 
  SparklesIcon, 
  XIcon, 
  FileTextIcon, 
  BookOpenIcon, 
  ChevronDownIcon,
  Settings2Icon,
  PlusIcon,
  TrashIcon,
  EditIcon,
  ChevronRightIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScreeningConfiguration, CustomField } from '@/lib/database.types';
import { AIProviderSelector } from './AIProviderSelector';

export type ExtractionMode = 'abstract' | 'fulltext';

interface UnifiedExtractionControlsProps {
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

export const UnifiedExtractionControls: React.FC<UnifiedExtractionControlsProps> = ({
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
  onDeleteConfig
}) => {
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const userConfigs = configurations.filter(c => c.visibility === 'private' && c.user_id === userId);
  const defaultConfigs = configurations.filter(c => c.visibility === 'default');
  const communityConfigs = configurations.filter(c => c.visibility === 'community');

  const activeFieldCount = customFields.filter(f => f.enabled).length;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg">
      {/* Main Control Line */}
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-200 rounded transition-transform"
          title={isExpanded ? "Collapse" : "Expand"}
        >
          <ChevronRightIcon 
            className={`h-4 w-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
          />
        </button>

        {/* Configuration Selector - Compact */}
        <div className="relative">
          <button
            onClick={() => setShowConfigMenu(!showConfigMenu)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span className="font-medium">{currentConfig?.name || 'Select Config'}</span>
            <span className="text-xs text-gray-500">({activeFieldCount} fields)</span>
            <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" />
          </button>
          
          {showConfigMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowConfigMenu(false)}
              />
              <div className="absolute left-0 z-20 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
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
                
                {/* Community Configurations */}
                {communityConfigs.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">Community</div>
                    {communityConfigs.map(config => (
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

        {/* Manage Button */}
        <Button
          size="sm"
          variant="ghost"
          onClick={onManageFields}
          className="h-8 px-2"
        >
          <Settings2Icon className="h-3.5 w-3.5" />
        </Button>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-300" />

        {/* Mode Toggle - Compact */}
        <div className="flex bg-white border border-gray-300 rounded-md overflow-hidden">
          <button
            onClick={() => onModeChange('abstract')}
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
              extractionMode === 'abstract'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            title="Extract from abstracts only"
          >
            Abstract
          </button>
          <div className="w-px bg-gray-300" />
          <button
            onClick={() => onModeChange('fulltext')}
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
              extractionMode === 'fulltext'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            title="Extract from full paper text"
          >
            Full Text
          </button>
        </div>

        {/* AI Provider - Show selected model inline */}
        {!isExpanded && (
          <>
            <div className="h-6 w-px bg-gray-300" />
            <div className="text-sm text-gray-600">
              {selectedModel.split('/').pop()?.split(':')[0] || 'AI Model'}
            </div>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Extract Button */}
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

      {/* Expanded Section */}
      {isExpanded && (
        <div className="px-4 pb-3 pt-0 border-t border-gray-200">
          <div className="flex items-center gap-4 pt-3">
            {/* AI Provider Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">AI Model:</span>
              <AIProviderSelector
                selectedProvider={selectedProvider}
                selectedModel={selectedModel}
                onProviderChange={onProviderChange}
              />
            </div>

            {/* Additional Info */}
            <div className="flex-1 text-xs text-gray-500">
              {currentConfig?.description && (
                <p className="line-clamp-1">{currentConfig.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 