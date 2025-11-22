import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import FileTree from '@/components/FileTree';
import CodeEditor from '@/components/CodeEditor';
import Preview from '@/components/Preview';
import AIChat from '@/components/AIChat';
import Terminal from '@/components/Terminal';
import ResizablePanel from '@/components/ResizablePanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIDEStore } from '@/lib/store';
import { useAIConfigStore } from '@/lib/aiConfig';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// TYPE ТОДОРХОЙЛОЛТ
interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
}

const PROJECT_ID = 'default';

export default function IDEPage() {
  const { toast } = useToast();
  const {
    theme,
    setTheme,
    tabs,
    activeTabId,
    addTab,
    closeTab,
    setActiveTab,
    updateTabContent,
    files,
    setFiles,
    messages,
    addMessage,
    terminalOutput,
    addTerminalOutput,
    clearTerminal,
    leftPanelWidth,
    rightPanelWidth,
    setLeftPanelWidth,
    setRightPanelWidth,
    showTerminal,
    terminalHeight,
    setShowTerminal,
    setTerminalHeight,
    viewMode,
  } = useIDEStore();

  useEffect(() => {
    // Анхны файлууд үүсгэх
    const initialFiles: FileNode[] = [
      {
        id: '1',
        name: 'index.html',
        path: '/index.html',
        type: 'file',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Awesome App</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>Welcome to My App!</h1>
        <p>Start coding here...</p>
        <div id="root"></div>
    </div>
    <script src="app.js"></script>
</body>
</html>`
      },
      {
        id: '2', 
        name: 'style.css',
        path: '/style.css',
        type: 'file',
        content: `/* Main Styles */
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
  background: #1e1e1e;
  color: white;
}`
      },
      {
        id: '3',
        name: 'app.js',
        path: '/app.js', 
        type: 'file',
        content: `// Main JavaScript Application
console.log('Hello World!');`
      }
    ];

    setFiles(initialFiles);
    setTheme('dark');
  }, [setFiles, setTheme]);

  const handleFileSelect = async (file: FileNode) => {
    if (file.type === 'file') {
      try {
        // Шинэ tab нээх
        const newTab = {
          id: file.id,
          path: file.path,
          name: file.name,
          content: file.content || '',
          modified: false,
          language: getLanguageFromFilename(file.name),
        };
        addTab(newTab);
        setActiveTab(file.id);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load file',
          variant: 'destructive',
        });
      }
    }
  };

  const getLanguageFromFilename = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'txt': 'plaintext'
    };
    return languageMap[ext] || 'plaintext';
  };

  const handleContentChange = async (tabId: string, content: string) => {
    updateTabContent(tabId, content);
    
    const tab = tabs.find((t: any) => t.id === tabId);
    if (!tab) return;

    try {
      await api.updateFile(PROJECT_ID, tab.path, content);
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  const {
    selectedProviderId,
    selectedModelId,
    apiKeys,
    advancedSettings,
  } = useAIConfigStore();

  const handleSendMessage = async (content: string) => {
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    addMessage(userMessage);

    try {
      const provider = selectedProviderId as string;
      const model = selectedModelId || 'gpt-4o-mini';
      const apiKey = apiKeys[selectedProviderId] || '';
      
      const response = await api.sendAIMessage(content, provider, apiKey, model, advancedSettings);
      
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };
      addMessage(aiResponse);
    } catch (error: any) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: `Error: ${error.message}`,
        timestamp: Date.now(),
      };
      addMessage(errorMessage);
      
      toast({
        title: 'AI Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCommand = (cmd: string) => {
    // Terminal command логик
    addTerminalOutput(`$ ${cmd}`);
    addTerminalOutput('Command executed');
  };

  // Preview компонентийн пропсуудыг бэлдэх
  const getPreviewProps = () => {
    const htmlFile = files.find(f => f.name === 'index.html');
    const cssFile = files.find(f => f.name === 'style.css');
    const jsFile = files.find(f => f.name === 'app.js');
    
    return {
      htmlCode: htmlFile?.content || '<div>No HTML file</div>',
      cssCode: cssFile?.content || '/* No CSS */',
      jsCode: jsFile?.content || '// No JS'
    };
  };

  const previewProps = getPreviewProps();

  return (
    <div className="replit-ide">
      <TopBar />
      
      <div className="main-content">
        {/* ЗҮҮН ТАЛЫН PANEL - ФАЙЛУУД */}
        <ResizablePanel
          defaultSize={leftPanelWidth}
          minSize={180}
          maxSize={500}
          side="left"
          onResize={setLeftPanelWidth}
        >
          <div className="left-sidebar h-full">
            <FileTree
              files={files}
              onFileSelect={handleFileSelect}
              selectedPath={tabs.find((t: any) => t.id === activeTabId)?.path}
            />
          </div>
        </ResizablePanel>

        {/* ТӨВ PANEL - EDITOR/PREVIEW */}
        <div className="center-panel">
          {viewMode === 'editor' && (
            <CodeEditor />
          )}
          
          {viewMode === 'split' && (
            <div className="split-view">
              <div className="split-editor">
                <CodeEditor />
              </div>
              <div className="split-preview">
                <Preview {...previewProps} />
              </div>
            </div>
          )}
          
          {viewMode === 'preview' && (
            <Preview {...previewProps} />
          )}
        </div>

        {/* БАРУУН ТАЛЫН PANEL - AI CHAT */}
        <ResizablePanel
          defaultSize={rightPanelWidth}
          minSize={280}
          maxSize={600}
          side="right"
          onResize={setRightPanelWidth}
        >
          <div className="right-sidebar h-full">
            <Tabs defaultValue="ai" className="h-full flex flex-col">
              <TabsList className="w-full rounded-none border-b">
                <TabsTrigger value="ai" className="flex-1">
                  🤖 AI Chat
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="ai" className="flex-1 mt-0 p-0">
                <AIChat />
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
      </div>

      {/* TERMINAL PANEL */}
      {showTerminal && (
        <ResizablePanel
          defaultSize={terminalHeight}
          minSize={120}
          maxSize={500}
          side="bottom"
          onResize={setTerminalHeight}
        >
          <div className="bottom-panel w-full">
            <Terminal
              output={terminalOutput}
              onCommand={handleCommand}
              onClear={clearTerminal}
            />
          </div>
        </ResizablePanel>
      )}
    </div>
  );
} 