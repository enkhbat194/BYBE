// CenterPanel.tsx - ШИНЭЧЛЭГДСЭН
import CodeEditor from "./CodeEditor";
import Preview from "./Preview";
import ResizablePanel from "./ResizablePanel";
import { useIDEStore } from "@/lib/store";
import { useCallback, useMemo } from "react";

export default function CenterPanel() {
  const {
    viewMode,
    files,
    tabs,
    activeTabId,
    updateTabContent,
    setActiveTab,
  } = useIDEStore();

  const previewProps = useMemo(() => {
    const find = (name: string) =>
      files.find((f) => f.name === name)?.content;

    return {
      htmlCode: find("index.html") ?? "<div>No HTML</div>",
      cssCode: find("style.css") ?? "/* No CSS */",
      jsCode: find("app.js") ?? "// No JS",
    };
  }, [files]);

  const handleContentChange = useCallback(
    (id: string, content: string) => {
      updateTabContent(id, content);
    },
    [updateTabContent]
  );

  const editorProps = useMemo(
    () => ({
      tabs,
      activeTabId,
      onTabChange: setActiveTab,
      onContentChange: handleContentChange,
    }),
    [tabs, activeTabId, setActiveTab, handleContentChange]
  );

  return (
    <div className="center-panel flex-1 flex overflow-hidden select-none">
      {viewMode === "editor" && (
        <div className="w-full h-full">
          <CodeEditor {...editorProps} />
        </div>
      )}

      {viewMode === "split" && (
        <div className="flex w-full h-full overflow-hidden border-l">
          <ResizablePanel
            side="left"
            minSize={280}
            maxSize={900}
            defaultSize={window.innerWidth * 0.55}
            onResize={() => {}}
          >
            <div className="border-r">
              <CodeEditor {...editorProps} />
            </div>
          </ResizablePanel>

          <div className="flex-1 bg-background">
            <Preview {...previewProps} />
          </div>
        </div>
      )}

      {viewMode === "preview" && (
        <div className="w-full h-full bg-background">
          <Preview {...previewProps} />
        </div>
      )}
    </div>
  );
}