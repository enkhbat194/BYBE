import { Code2, Terminal, X, Plus, Split, Eye } from 'lucide-react';
import { useIDEStore } from '@/lib/store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function TopBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, viewMode, setViewMode } = useIDEStore();

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
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">BY</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
