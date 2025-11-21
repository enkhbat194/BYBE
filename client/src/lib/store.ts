import { create } from 'zustand';
import type { FileNode, EditorTab, AIMessage, AIProvider } from '@shared/schema';

interface IDEStore {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  
  aiProvider: string;
  setAIProvider: (provider: string) => void;
  
  tabs: EditorTab[];
  activeTabId: string | null;
  addTab: (tab: EditorTab) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  
  files: FileNode[];
  setFiles: (files: FileNode[]) => void;
  
  messages: AIMessage[];
  addMessage: (message: AIMessage) => void;
  clearMessages: () => void;
  
  terminalOutput: string[];
  addTerminalOutput: (output: string) => void;
  clearTerminal: () => void;
  
  leftPanelWidth: number;
  rightPanelWidth: number;
  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
}

export const useIDEStore = create<IDEStore>((set) => ({
  theme: 'dark',
  setTheme: (theme) => {
    set({ theme });
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
  
  aiProvider: 'openai',
  setAIProvider: (provider) => set({ aiProvider: provider }),
  
  tabs: [],
  activeTabId: null,
  addTab: (tab) => set((state) => {
    const exists = state.tabs.find(t => t.path === tab.path);
    if (exists) {
      return { activeTabId: exists.id };
    }
    return { tabs: [...state.tabs, tab], activeTabId: tab.id };
  }),
  closeTab: (tabId) => set((state) => {
    const newTabs = state.tabs.filter(t => t.id !== tabId);
    const newActiveId = state.activeTabId === tabId 
      ? (newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null)
      : state.activeTabId;
    return { tabs: newTabs, activeTabId: newActiveId };
  }),
  setActiveTab: (tabId) => set({ activeTabId: tabId }),
  updateTabContent: (tabId, content) => set((state) => ({
    tabs: state.tabs.map(t => 
      t.id === tabId ? { ...t, content, modified: true } : t
    )
  })),
  
  files: [],
  setFiles: (files) => set({ files }),
  
  messages: [],
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  clearMessages: () => set({ messages: [] }),
  
  terminalOutput: [],
  addTerminalOutput: (output) => set((state) => ({
    terminalOutput: [...state.terminalOutput, output]
  })),
  clearTerminal: () => set({ terminalOutput: [] }),
  
  leftPanelWidth: 240,
  rightPanelWidth: 320,
  setLeftPanelWidth: (width) => set({ leftPanelWidth: width }),
  setRightPanelWidth: (width) => set({ rightPanelWidth: width }),
}));
