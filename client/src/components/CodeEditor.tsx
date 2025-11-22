import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { EditorTab } from '@shared/schema';
import { useIDEStore } from '@/lib/store';

export default function CodeEditor() {
  const { theme, activeTabId, tabs, updateTabContent } = useIDEStore();
  const editorRef = useRef<any>(null);

  const activeTab = tabs.find(t => t.id === activeTabId);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleContentChange = (value?: string) => {
    if (activeTabId) {
      updateTabContent(activeTabId, value || '');
    }
  };

  return (
    <div className="h-full flex flex-col center-panel">
      <div className="flex-1 relative">
        {activeTab ? (
          <Editor
            height="100%"
            language={activeTab.language}
            value={activeTab.content}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            onChange={handleContentChange}
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
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground bg-[#1e1e1e]">
            No file open. Select a file from the tree to edit.
          </div>
        )}
      </div>

      {activeTab && (
        <div className="border-t px-3 py-1 flex items-center justify-between text-xs text-muted-foreground bg-[#252526]">
          <span data-testid="text-file-path">{activeTab.path}</span>
          <span data-testid="text-file-language">{activeTab.language}</span>
        </div>
      )}
    </div>
  );
}
