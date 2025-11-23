import { useEffect, useRef } from "react";
import TerminalTab from "./TerminalTab";
import Editor from "@monaco-editor/react";
import { useIDEStore } from "@/lib/store";

interface CodeEditorProps {
  tabs: any[];
  activeTabId: string | null;
  onTabChange: (tabId: string) => void;
  onContentChange: (id: string, content: string) => void;
}

export default function CodeEditor({
  tabs,
  activeTabId,
  onTabChange,
  onContentChange,
}: CodeEditorProps) {
  const { theme } = useIDEStore();
  const editorRef = useRef<any>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const handleMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleChange = (value?: string) => {
    if (activeTabId) {
      onContentChange(activeTabId, value || "");
    }
  };

  return (
    <div className="h-full flex flex-col center-panel">
      <div className="flex-1 relative">
        {activeTabId === 'terminal' ? (
          <TerminalTab />
        ) : activeTab ? (
          <Editor
            height="100%"
            language={activeTab.language}
            value={activeTab.content}
            theme={theme === "dark" ? "vs-dark" : "light"}
            onChange={handleChange}
            onMount={handleMount}
            options={{
              fontSize: 14,
              fontFamily: "JetBrains Mono, monospace",
              minimap: { enabled: true },
              lineNumbers: "on",
              automaticLayout: true,
              scrollBeyondLastLine: false,
              tabSize: 2,
              wordWrap: "off",
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground bg-[#1e1e1e]">
            No file open. Select a file from the tree to edit.
          </div>
        )}
      </div>

      {activeTab && activeTab.id !== 'terminal' && (
        <div className="border-t px-3 py-1 flex items-center justify-between text-xs text-muted-foreground bg-[#252526]">
          <span>{activeTab.path}</span>
          <span>{activeTab.language}</span>
        </div>
      )}
    </div>
  );
}
