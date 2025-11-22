import { Code2, Terminal, X, Plus, Split, Eye } from 'lucide-react';
import { useIDEStore } from '@/lib/store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function TopBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, viewMode, setViewMode, showTerminal, setShowTerminal } = useIDEStore();

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  return (
    <div className="top-bar">
      <div className="tabs-container">
        <div className="flex items-center gap-2 px-2 py-1">
          <Code2 className="h-4 w-4" />
          <span className="text-sm font-semibold">Bybe</span>
        </div>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            <span className="text-xs truncate max-w-[120px]">{tab.name}</span>
            {tab.modified && <span className="text-xs ml-1">●</span>}
            <button 
              className="tab-close"
              onClick={(e) => handleCloseTab(tab.id, e)}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <div className="tab">
          <button className="w-full h-full flex items-center justify-center text-xs">
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="view-toggle">
        <button 
          className={`editor ${viewMode === 'editor' ? 'active' : ''}`}
          onClick={() => setViewMode('editor')}
        >
          Editor
        </button>
        <button 
          className={`split ${viewMode === 'split' ? 'active' : ''}`}
          onClick={() => setViewMode('split')}
        >
          <Split className="h-4 w-4 inline mr-1" />Split
        </button>
        <button 
          className={`preview ${viewMode === 'preview' ? 'active' : ''}`}
          onClick={() => setViewMode('preview')}
        >
          <Eye className="h-4 w-4 inline mr-1" />Preview
        </button>
        <button
          className=""
          onClick={() => setShowTerminal(!showTerminal)}
        >
          <Terminal className="h-4 w-4" />
        </button>
        <Avatar className="h-8 w-8 ml-2">
          <AvatarFallback className="text-xs">BY</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
