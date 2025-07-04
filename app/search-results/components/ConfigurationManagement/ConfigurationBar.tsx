import React from 'react';
import { Settings2Icon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScreeningConfiguration, CustomField } from '@/lib/database.types';

interface ConfigurationBarProps {
  configurations: ScreeningConfiguration[];
  currentConfig: ScreeningConfiguration | null;
  selectedConfig: string;
  customFields: CustomField[];
  userId: string;
  onConfigChange: (configId: string) => void;
  onManageFields: () => void;
  onAddColumn: () => void;
  onSaveConfig?: () => void;
}

export const ConfigurationBar: React.FC<ConfigurationBarProps> = ({
  configurations,
  currentConfig,
  selectedConfig,
  customFields,
  userId,
  onConfigChange,
  onManageFields,
  onAddColumn,
  onSaveConfig
}) => {
  return (
    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">AI-Extracted Fields</span>
          <div className="flex items-center gap-2">
            <select
              className="text-sm border border-gray-300 rounded px-3 py-1 bg-white"
              value={selectedConfig}
              onChange={(e) => onConfigChange(e.target.value)}
            >
              {/* Default configurations */}
              {configurations.filter(c => c.visibility === 'default').map(config => (
                <option key={config.id} value={config.id}>
                  Default - {config.name}
                </option>
              ))}
              
              {/* Community configurations */}
              {configurations.filter(c => c.visibility === 'community').length > 0 && (
                <optgroup label="Community">
                  {configurations.filter(c => c.visibility === 'community').map(config => (
                    <option key={config.id} value={config.id}>
                      {config.name}
                    </option>
                  ))}
                </optgroup>
              )}
              
              {/* User's private configurations */}
              {configurations.filter(c => c.visibility === 'private' && c.user_id === userId).length > 0 && (
                <optgroup label="My Configurations">
                  {configurations.filter(c => c.visibility === 'private' && c.user_id === userId).map(config => (
                    <option key={config.id} value={config.id}>
                      {config.name}
                    </option>
                  ))}
                </optgroup>
              )}
              
              <option value="custom">+ Create New Configuration</option>
            </select>
            <Button
              size="sm"
              variant="outline"
              onClick={onManageFields}
            >
              <Settings2Icon className="h-4 w-4 mr-2" />
              Manage Fields
            </Button>
            <Button
              size="sm"
              onClick={onAddColumn}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Column
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {currentConfig?.user_id === userId && currentConfig?.visibility === 'private' && onSaveConfig && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onSaveConfig}
              className="text-xs"
            >
              <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Config
            </Button>
          )}
          <div className="text-xs text-gray-500">
            {customFields.filter(f => f.enabled).length} active fields
          </div>
        </div>
      </div>
    </div>
  );
}; 