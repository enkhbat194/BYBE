import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import FileTree from '@/components/FileTree';
import CodeEditor from '@/components/CodeEditor';
import AIChat from '@/components/AIChat';
import Terminal from '@/components/Terminal';
import ResizablePanel from '@/components/ResizablePanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIDEStore } from '@/lib/store';
import { useAIConfigStore } from '@/lib/aiConfig';
import { api } from '@/lib/api';
import TerminalSocket from '@/lib/TerminalSocket';
import { useToast } from '@/hooks/use-toast';
import type { FileNode, EditorTab, AIMessage, AIProviderName } from '@shared/schema';

const PROJECT_ID = 'default';

export default function IDEPage() {
  const { toast } = useToast();
  const [terminalSocket, setTerminalSocket] = useState<TerminalSocket | null>(null);
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
    setTheme(theme);
    loadProject();
    
    const socket = new TerminalSocket()
      .connect()
      .onOutput((output: string, type: string) => {
        if (type === 'clear') {
          clearTerminal();
        } else {
          addTerminalOutput(output);
        }
      });
    
    setTerminalSocket(socket);

    return () => {
      socket.disconnect();
    };
  }, []);

  const loadProject = async () => {
    try {
      const projectFiles = await api.getFiles(PROJECT_ID);
      setFiles(projectFiles);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load project files',
        variant: 'destructive',
      });
    }
  };

  const handleFileSelect = async (file: FileNode) => {
    if (file.type === 'file') {
      try {
        const fileData = await api.getFile(PROJECT_ID, file.path);
        
        const newTab: EditorTab = {
          id: file.id,
          path: file.path,
          name: file.name,
          content: fileData.content || '',
          modified: false,
          language: file.name.endsWith('.tsx') || file.name.endsWith('.ts') 
            ? 'typescript' 
            : file.name.endsWith('.jsx') || file.name.endsWith('.js')
            ? 'javascript'
            : file.name.endsWith('.json') 
            ? 'json' 
            : file.name.endsWith('.html') 
            ? 'html' 
            : file.name.endsWith('.css')
            ? 'css'
            : file.name.endsWith('.md')
            ? 'markdown'
            : 'plaintext',
        };
        addTab(newTab);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load file',
          variant: 'destructive',
        });
      }
    }
  };

  const handleContentChange = async (tabId: string, content: string) => {
    updateTabContent(tabId, content);
    
    const tab = tabs.find(t => t.id === tabId);
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
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    addMessage(userMessage);

    try {
      const provider = selectedProviderId as AIProviderName;
      const model = selectedModelId || 'gpt-4o-mini'; // fallback model
      const apiKey = apiKeys[selectedProviderId] || '';
      
      const response = await api.sendAIMessage(content, provider, apiKey, model, advancedSettings);
      
      const aiResponse: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };
      addMessage(aiResponse);
    } catch (error: any) {
      const errorMessage: AIMessage = {
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
    if (terminalSocket) {
      terminalSocket.sendCommand(cmd);
    }
  };

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-black'}`}>
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
            onContentChange={handleContentChange}
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
                <AIChat />
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
