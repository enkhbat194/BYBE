import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TabsProps {
  files: Record<string, string>;
  activeFile: string;
  onTabSelect: (filename: string) => void;
  onTabClose: (filename: string) => void;
}

export default function Tabs({ files, activeFile, onTabSelect, onTabClose }: TabsProps) {
  return (
    <div className="flex border-b bg-muted/40">
      {Object.keys(files).map(filename => (
        <div 
          key={filename}
          className={`flex items-center gap-1 px-3 py-2 border-r border-b cursor-pointer transition-colors ${
            activeFile === filename 
              ? 'border-primary bg-background text-primary' 
              : 'hover:bg-muted text-muted-foreground'
          }`}
        >
          <span 
            className="text-sm font-medium truncate max-w-[150px]"
            onClick={() => onTabSelect(filename)}
            title={filename}
          >
            {filename}
          </span>
          <Button 
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 ml-1 hover:bg-destructive text-destructive-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(filename);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="sm" className="h-10 px-3 border-l border-b-0">
        +
      </Button>
    </div>
  );
}
