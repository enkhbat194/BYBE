import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { EditorTab } from '@shared/schema';
import { useIDEStore } from '@/lib/store';

interface CodeEditorProps {
  tabs: EditorTab[];
  activeTabId: string | null;
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onContentChange: (tabId: string, content: string) => void;
}

export default function CodeEditor({
  tabs,
  activeTabId,
  onTabChange,
  onTabClose,
  onContentChange,
}: CodeEditorProps) {
  const { theme } = useIDEStore();
  const editorRef = useRef<any>(null);

  const activeTab = tabs.find(t => t.id === activeTabId);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="border-b">
        <div className="flex items-center gap-0.5 px-2 min-h-9">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`group flex items-center gap-1 px-3 py-1.5 text-xs cursor-pointer border-b-2 transition-colors ${
                activeTabId === tab.id
                  ? 'border-primary bg-accent'
                  : 'border-transparent hover-elevate'
              }`}
              onClick={() => onTabChange(tab.id)}
              data-testid={`tab-${tab.name}`}
            >
              <span className={tab.modified ? 'italic' : ''}>{tab.name}</span>
              {tab.modified && <span className="text-[10px] text-muted-foreground">●</span>}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                data-testid={`button-close-tab-${tab.name}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="flex-1 relative">
        {activeTab ? (
          <Editor
            height="100%"
            language={activeTab.language}
            value={activeTab.content}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            onChange={(value) => onContentChange(activeTab.id, value || '')}
            onMount={handleEditorDidMount}
            options={{
              fontSize: 14,
              fontFamily: 'JetBrains Mono, monospace',
              minimap: { enabled: true },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'off',
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            No file open. Select a file from the tree to edit.
          </div>
        )}
      </div>

      {activeTab && (
        <div className="border-t px-3 py-1 flex items-center justify-between text-xs text-muted-foreground">
          <span data-testid="text-file-path">{activeTab.path}</span>
          <span data-testid="text-file-language">{activeTab.language}</span>
        </div>
      )}
    </div>
  );
}
