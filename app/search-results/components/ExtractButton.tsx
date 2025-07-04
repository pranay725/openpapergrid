import React from 'react';
import { SparklesIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExtractButtonProps {
  isExtracting: boolean;
  hasExtracted: boolean;
  onExtract: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

export const ExtractButton: React.FC<ExtractButtonProps> = ({
  isExtracting,
  hasExtracted,
  onExtract,
  onCancel,
  disabled = false
}) => {
  if (isExtracting) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={onCancel}
        className="gap-2"
      >
        <XIcon className="h-4 w-4" />
        Cancel Extraction
      </Button>
    );
  }

  if (hasExtracted) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={onExtract}
        disabled={disabled}
        className="gap-2 text-green-600 border-green-600 hover:bg-green-50"
      >
        <SparklesIcon className="h-4 w-4" />
        Re-extract
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      onClick={onExtract}
      disabled={disabled}
      className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
    >
      <SparklesIcon className="h-4 w-4" />
      Extract with AI
    </Button>
  );
}; 