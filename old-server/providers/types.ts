export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
  content?: string;
  children?: FileNode[];
  isOpen?: boolean;
  parentId?: string | null;
}

export interface Tab {
  id: string;
  path: string;
  name: string;
  content: string;
  modified: boolean;
  language: string;
  isDirty?: boolean;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  isError?: boolean;
}

export interface IDEStore {
  // Theme & Appearance
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  
  // Panel Sizes & Layout
  leftPanelWidth: number;
  rightPanelWidth: number;
  terminalHeight: number;
  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  setTerminalHeight: (height: number) => void;

  // File System
  files: FileNode[];
  setFiles: (files: FileNode[]) => void;
  createFile: (path: string, name: string, content?: string, parentId?: string) => void;
  deleteFile: (id: string) => void;
  renameFile: (id: string, newName: string) => void;
  updateFileContent: (id: string, content: string) => void;
  refreshFileTree: () => void;

  // Tabs Management
  tabs: Tab[];
  activeTabId: string | null;
  addTab: (tab: Tab) => void;
  closeTab: (id: string) => void;
  closeAllTabs: () => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  markTabAsDirty: (id: string, isDirty: boolean) => void;

  // View Modes
  viewMode: "editor" | "split" | "preview";
  setViewMode: (mode: "editor" | "split" | "preview") => void;

  // Terminal
  showTerminal: boolean;
  terminalOutput: string[];
  addTerminalOutput: (line: string) => void;
  clearTerminal: () => void;
  setShowTerminal: (show: boolean) => void;
  executeCommand: (command: string) => void;

  // AI Chat
  messages: AIMessage[];
  addMessage: (message: AIMessage) => void;
  clearMessages: () => void;
  isAILoading: boolean;
  setIsAILoading: (loading: boolean) => void;

  // Project Management
  currentProject: string;
  setCurrentProject: (project: string) => void;
  projects: string[];
  addProject: (project: string) => void;
  removeProject: (project: string) => void;

  // Editor Settings
  fontSize: number;
  setFontSize: (size: number) => void;
  wordWrap: boolean;
  setWordWrap: (wrap: boolean) => void;
  lineNumbers: boolean;
  setLineNumbers: (show: boolean) => void;

  // Search & Navigation
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: FileNode[];
  setSearchResults: (results: FileNode[]) => void;

  // UI State
  isLeftPanelOpen: boolean;
  isRightPanelOpen: boolean;
  setIsLeftPanelOpen: (open: boolean) => void;
  setIsRightPanelOpen: (open: boolean) => void;

  // File Operations State
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
}

export interface ProjectConfig {
  id: string;
  name: string;
  path: string;
  createdAt: number;
  lastModified: number;
  fileStructure: FileNode[];
  settings: {
    defaultViewMode: "editor" | "split" | "preview";
    autoSave: boolean;
    formatOnSave: boolean;
  };
}

export interface EditorPosition {
  line: number;
  column: number;
  scrollTop: number;
}

export interface EditorState {
  [tabId: string]: EditorPosition;
}

export interface SessionState {
  activeProject: string;
  openTabs: string[];
  lastActiveTab: string | null;
  layout: {
    leftPanelWidth: number;
    rightPanelWidth: number;
    terminalHeight: number;
  };
}

// Utility types
export type FileType = 
  | "javascript" 
  | "typescript" 
  | "html" 
  | "css" 
  | "json" 
  | "markdown" 
  | "python" 
  | "plaintext";

export type Theme = "light" | "dark" | "auto";

export type PanelSide = "left" | "right" | "bottom";

export interface DragAndDropState {
  isDragging: boolean;
  draggedItem: FileNode | null;
  dropTarget: string | null;
}

export interface KeyboardShortcuts {
  [key: string]: {
    action: string;
    description: string;
    handler: () => void;
  };
}
