// LeftSidebar.tsx - ШИНЭЧЛЭГДСЭН
import { useCallback } from "react";
import ResizablePanel from "@/components/ResizablePanel";
import FileTree from "@/components/FileTree";
import { useIDEStore } from "@/lib/store";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface FileNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
}

export default function LeftSidebar() {
  const {
    files,
    tabs,
    activeTabId,
    addTab,
    setActiveTab,
    leftPanelWidth,
    setLeftPanelWidth,
  } = useIDEStore();

  const { toast } = useToast();

  const detectLanguage = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase();
    const map: Record<string, string> = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      html: "html",
      css: "css",
      json: "json",
      md: "markdown",
      py: "python",
      txt: "plaintext",
    };
    return map[ext || ""] || "plaintext";
  };

  const handleFileSelect = useCallback(
    async (file: FileNode) => {
      if (file.type !== "file") return;

      const existing = tabs.find((t) => t.path === file.path);
      if (existing) {
        setActiveTab(existing.id);
        return;
      }

      try {
        const fileData = await api.getFile("default", file.path);

        const newTab = {
          id: `${file.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          path: file.path,
          name: file.name,
          content: fileData?.content ?? "",
          modified: false,
          language: detectLanguage(file.name),
          isDirty: false,
        };

        addTab(newTab);
        setActiveTab(newTab.id);
      } catch (e) {
        toast({
          title: "Error",
          description: "Failed to open file",
          variant: "destructive",
        });
      }
    },
    [tabs, addTab, setActiveTab, toast]
  );

  const selectedPath = tabs.find((t) => t.id === activeTabId)?.path;

  return (
    <ResizablePanel
      defaultSize={leftPanelWidth}
      minSize={180}
      maxSize={500}
      side="left"
      onResize={setLeftPanelWidth}
    >
      <div className="left-sidebar h-full border-r border-border bg-background">
        <FileTree
          files={files}
          onFileSelect={handleFileSelect}
          selectedPath={selectedPath}
        />
      </div>
    </ResizablePanel>
  );
}