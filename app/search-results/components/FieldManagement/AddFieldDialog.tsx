import React, { useState } from 'react';
import { XIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CustomField } from '@/lib/database.types';

interface AddFieldDialogProps {
  show: boolean;
  showConfigBuilder: boolean;
  onClose: () => void;
  onAdd: (field: CustomField) => void;
}

export const AddFieldDialog: React.FC<AddFieldDialogProps> = ({
  show,
  showConfigBuilder,
  onClose,
  onAdd
}) => {
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<CustomField['type']>('text');

  const handleAdd = () => {
    if (fieldName.trim()) {
      const newField: CustomField = {
        id: `custom_${Date.now()}`,
        name: fieldName,
        type: fieldType,
        enabled: true,
        prompt: '',
        isAI: true,
        options: fieldType === 'select' || fieldType === 'multi_select' ? [] : undefined
      };
      
      onAdd(newField);
      setFieldName('');
      setFieldType('text');
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 ${showConfigBuilder ? 'z-[60]' : 'z-50'} flex items-center justify-center p-4`}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Add New Field</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Name
            </label>
            <Input
              placeholder="e.g., Study Design"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && fieldName.trim()) {
                  handleAdd();
                }
              }}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Type
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value as CustomField['type'])}
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="boolean">Yes/No</option>
              <option value="select">Single Select</option>
              <option value="multi_select">Multi Select</option>
            </select>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setFieldName('');
                setFieldType('text');
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!fieldName.trim()}
            >
              Add Field
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 