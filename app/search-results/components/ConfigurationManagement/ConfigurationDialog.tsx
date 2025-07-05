import React, { useState, useEffect } from 'react';
import { XIcon, PlusIcon, Settings2Icon, TrashIcon, GripVerticalIcon, SaveIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScreeningConfiguration, CustomField } from '@/lib/database.types';
import { createConfiguration, updateConfiguration } from '@/lib/screening-config-api';

interface ConfigurationDialogProps {
  show: boolean;
  configurations: ScreeningConfiguration[];
  currentConfig: ScreeningConfiguration | null;
  userId: string;
  onClose: () => void;
  onConfigChange: (config: ScreeningConfiguration) => void;
  onFieldsUpdate: (fields: CustomField[]) => void;
}

export const ConfigurationDialog: React.FC<ConfigurationDialogProps> = ({
  show,
  configurations,
  currentConfig,
  userId,
  onClose,
  onConfigChange,
  onFieldsUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'manage' | 'create'>('manage');
  const [fields, setFields] = useState<CustomField[]>(currentConfig?.fields || []);
  const [configName, setConfigName] = useState('');
  const [configDescription, setConfigDescription] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<CustomField['type']>('text');
  const [newFieldPrompt, setNewFieldPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingConfigName, setEditingConfigName] = useState(currentConfig?.name || '');
  const [editingConfigDescription, setEditingConfigDescription] = useState(currentConfig?.description || '');

  useEffect(() => {
    if (currentConfig) {
      setFields(currentConfig.fields);
      setEditingConfigName(currentConfig.name);
      setEditingConfigDescription(currentConfig.description || '');
    }
  }, [currentConfig]);

  const handleAddField = () => {
    if (!newFieldName.trim()) return;

    const newField: CustomField = {
      id: `custom_${Date.now()}`,
      name: newFieldName,
      type: newFieldType,
      enabled: true,
      prompt: newFieldPrompt,
      isAI: true,
      options: newFieldType === 'select' || newFieldType === 'multi_select' ? [] : undefined
    };

    setFields([...fields, newField]);
    setNewFieldName('');
    setNewFieldType('text');
    setNewFieldPrompt('');
  };

  const handleToggleField = (fieldId: string) => {
    setFields(fields.map(f => 
      f.id === fieldId ? { ...f, enabled: !f.enabled } : f
    ));
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
  };

  const handleSaveConfiguration = async () => {
    if (!currentConfig || currentConfig.visibility !== 'private') return;
    
    setIsSaving(true);
    try {
      await updateConfiguration(currentConfig.id, { 
        name: editingConfigName,
        description: editingConfigDescription,
        fields 
      });
      onFieldsUpdate(fields);
      alert('Configuration saved successfully!');
    } catch (error) {
      alert('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateConfiguration = async () => {
    if (!configName.trim()) return;

    setIsSaving(true);
    try {
      const newConfig = await createConfiguration(
        configName,
        configDescription,
        fields,
        'private'
      );
      
      onConfigChange(newConfig);
      setActiveTab('manage');
      setConfigName('');
      setConfigDescription('');
      alert('Configuration created successfully!');
    } catch (error) {
      alert('Failed to create configuration');
    } finally {
      setIsSaving(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Configuration Management</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setActiveTab('manage')}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'manage'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Manage Fields
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'create'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Create New Configuration
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'manage' ? (
            <div className="space-y-6">
              {/* Current Configuration Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                {currentConfig?.visibility === 'private' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Configuration Name
                      </label>
                      <Input
                        value={editingConfigName}
                        onChange={(e) => setEditingConfigName(e.target.value)}
                        placeholder="Configuration name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        value={editingConfigDescription}
                        onChange={(e) => setEditingConfigDescription(e.target.value)}
                        placeholder="Configuration description"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="font-medium text-gray-900 mb-2">
                      Current Configuration: {currentConfig?.name || 'None'}
                    </h3>
                    {currentConfig?.description && (
                      <p className="text-sm text-gray-600">{currentConfig.description}</p>
                    )}
                  </>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  {currentConfig?.visibility === 'private' ? 'Private' : 'Default'} • 
                  {fields.filter(f => f.enabled).length} active fields
                </div>
              </div>

              {/* Add New Field */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium mb-3">Add New Field</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Field name"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                  />
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as CustomField['type'])}
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="boolean">Yes/No</option>
                    <option value="select">Single Select</option>
                    <option value="multi_select">Multi Select</option>
                  </select>
                </div>
                <Input
                  className="mt-3"
                  placeholder="AI extraction prompt (optional)"
                  value={newFieldPrompt}
                  onChange={(e) => setNewFieldPrompt(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={handleAddField}
                  disabled={!newFieldName.trim()}
                  className="mt-3"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>

              {/* Fields List */}
              <div className="space-y-2">
                <h4 className="font-medium mb-3">Fields</h4>
                {fields.length === 0 ? (
                  <p className="text-gray-500 text-sm">No fields configured</p>
                ) : (
                  fields.map((field) => (
                    <div
                      key={field.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg ${
                        field.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <GripVerticalIcon className="h-4 w-4 text-gray-400" />
                      <input
                        type="checkbox"
                        checked={field.enabled}
                        onChange={() => handleToggleField(field.id)}
                        className="rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{field.name}</div>
                        <div className="text-xs text-gray-500">
                          Type: {field.type}
                          {field.prompt && ` • Prompt: ${field.prompt.substring(0, 50)}...`}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteField(field.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Configuration Name
                </label>
                <Input
                  placeholder="e.g., Clinical Trial Analysis"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe what this configuration is for..."
                  value={configDescription}
                  onChange={(e) => setConfigDescription(e.target.value)}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  This will create a new private configuration with {fields.length} fields. 
                  You can modify the fields after creation.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
            
            <div className="flex gap-3">
              {activeTab === 'manage' && currentConfig?.visibility === 'private' && (
                <Button
                  onClick={handleSaveConfiguration}
                  disabled={isSaving}
                >
                  <SaveIcon className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
              
              {activeTab === 'create' && (
                <Button
                  onClick={handleCreateConfiguration}
                  disabled={!configName.trim() || isSaving}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  {isSaving ? 'Creating...' : 'Create Configuration'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 