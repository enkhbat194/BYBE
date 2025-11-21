import { useEffect } from 'react';
import TopBar from '@/components/TopBar';
import FileTree from '@/components/FileTree';
import CodeEditor from '@/components/CodeEditor';
import AIChat from '@/components/AIChat';
import Terminal from '@/components/Terminal';
import ResizablePanel from '@/components/ResizablePanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIDEStore } from '@/lib/store';
import type { FileNode, EditorTab, AIMessage } from '@shared/schema';

const mockFiles: FileNode[] = [
  {
    id: '1',
    name: 'src',
    type: 'folder',
    path: '/src',
    children: [
      {
        id: '2',
        name: 'components',
        type: 'folder',
        path: '/src/components',
        children: [
          { id: '3', name: 'App.tsx', type: 'file', path: '/src/components/App.tsx', content: 'import React from "react";\n\nfunction App() {\n  return (\n    <div className="app">\n      <h1>Hello Bybe!</h1>\n    </div>\n  );\n}\n\nexport default App;' },
          { id: '4', name: 'Header.tsx', type: 'file', path: '/src/components/Header.tsx', content: 'export default function Header() {\n  return <header>My App</header>;\n}' },
        ],
      },
      { id: '5', name: 'index.ts', type: 'file', path: '/src/index.ts', content: 'import App from "./components/App";\n\nconsole.log("App loaded");' },
      { id: '6', name: 'utils.ts', type: 'file', path: '/src/utils.ts', content: 'export function add(a: number, b: number) {\n  return a + b;\n}' },
    ],
  },
  {
    id: '7',
    name: 'public',
    type: 'folder',
    path: '/public',
    children: [
      { id: '8', name: 'index.html', type: 'file', path: '/public/index.html', content: '<!DOCTYPE html>\n<html>\n  <head><title>App</title></head>\n  <body><div id="root"></div></body>\n</html>' },
    ],
  },
  { id: '9', name: 'package.json', type: 'file', path: '/package.json', content: '{\n  "name": "my-app",\n  "version": "1.0.0"\n}' },
  { id: '10', name: 'README.md', type: 'file', path: '/README.md', content: '# My Project\n\nWelcome to my awesome project!' },
];

export default function IDEPage() {
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
  } = useIDEStore();

  useEffect(() => {
    setFiles(mockFiles);
    setTheme(theme);
  }, []);

  const handleFileSelect = (file: FileNode) => {
    if (file.type === 'file') {
      const newTab: EditorTab = {
        id: file.id,
        path: file.path,
        name: file.name,
        content: file.content || '',
        modified: false,
        language: file.name.endsWith('.tsx') || file.name.endsWith('.ts') 
          ? 'typescript' 
          : file.name.endsWith('.json') 
          ? 'json' 
          : file.name.endsWith('.html') 
          ? 'html' 
          : file.name.endsWith('.md')
          ? 'markdown'
          : 'plaintext',
      };
      addTab(newTab);
    }
  };

  const handleSendMessage = (content: string) => {
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    addMessage(userMessage);

    setTimeout(() => {
      const aiResponse: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand you're asking about: "${content}". Let me help you with that! This is a demo response from the AI assistant.`,
        timestamp: Date.now(),
      };
      addMessage(aiResponse);
    }, 1000);
  };

  const handleCommand = (cmd: string) => {
    addTerminalOutput(`$ ${cmd}`);
    
    setTimeout(() => {
      if (cmd === 'clear') {
        clearTerminal();
      } else if (cmd.startsWith('npm')) {
        addTerminalOutput('Running npm command...');
        addTerminalOutput('✓ Command completed successfully');
      } else {
        addTerminalOutput(`Executing: ${cmd}`);
        addTerminalOutput('Done!');
      }
    }, 500);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar />
      
      <div className="flex-1 flex overflow-hidden">
        <ResizablePanel
          defaultWidth={leftPanelWidth}
          minWidth={180}
          maxWidth={400}
          side="left"
          onResize={setLeftPanelWidth}
        >
          <div className="h-full border-r">
            <FileTree
              files={files}
              onFileSelect={handleFileSelect}
              selectedPath={tabs.find(t => t.id === activeTabId)?.path}
            />
          </div>
        </ResizablePanel>

        <div className="flex-1 min-w-0">
          <CodeEditor
            tabs={tabs}
            activeTabId={activeTabId}
            onTabChange={setActiveTab}
            onTabClose={closeTab}
            onContentChange={updateTabContent}
          />
        </div>

        <ResizablePanel
          defaultWidth={rightPanelWidth}
          minWidth={280}
          maxWidth={500}
          side="right"
          onResize={setRightPanelWidth}
        >
          <div className="h-full border-l">
            <Tabs defaultValue="ai" className="h-full flex flex-col">
              <TabsList className="w-full rounded-none border-b h-10 justify-start px-2">
                <TabsTrigger value="ai" className="text-xs" data-testid="tab-ai">
                  AI Chat
                </TabsTrigger>
                <TabsTrigger value="terminal" className="text-xs" data-testid="tab-terminal">
                  Terminal
                </TabsTrigger>
              </TabsList>
              <TabsContent value="ai" className="flex-1 mt-0 overflow-hidden">
                <AIChat messages={messages} onSendMessage={handleSendMessage} />
              </TabsContent>
              <TabsContent value="terminal" className="flex-1 mt-0 overflow-hidden">
                <Terminal
                  output={terminalOutput}
                  onCommand={handleCommand}
                  onClear={clearTerminal}
                />
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
      </div>
    </div>
  );
}
