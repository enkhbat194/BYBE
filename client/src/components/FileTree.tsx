import { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, Trash2, Edit2 } from 'lucide-react';
import type { FileNode } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface FileTreeProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  selectedPath?: string;
}

export default function FileTree({ files, onFileSelect, selectedPath }: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleContextMenu = (action: string, node: FileNode) => {
    console.log(`${action} triggered for ${node.name}`);
  };

  const renderNode = (node: FileNode, depth: number = 0): JSX.Element => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedPath === node.path;
    const paddingLeft = depth * 12 + 8;

    if (node.type === 'folder') {
      return (
        <div key={node.path}>
          <ContextMenu>
            <ContextMenuTrigger>
              <div
                className={`flex items-center gap-1 py-1 px-2 text-sm cursor-pointer hover-elevate ${
                  isSelected ? 'bg-accent' : ''
                }`}
                style={{ paddingLeft: `${paddingLeft}px` }}
                onClick={() => toggleFolder(node.path)}
                data-testid={`folder-${node.name}`}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-3 w-3 flex-shrink-0" />
                )}
                {isExpanded ? (
                  <FolderOpen className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                ) : (
                  <Folder className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                )}
                <span className="truncate">{node.name}</span>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => handleContextMenu('New File', node)} data-testid="context-new-file">
                <Plus className="h-3 w-3 mr-2" />
                New File
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleContextMenu('Rename', node)} data-testid="context-rename">
                <Edit2 className="h-3 w-3 mr-2" />
                Rename
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleContextMenu('Delete', node)} data-testid="context-delete">
                <Trash2 className="h-3 w-3 mr-2" />
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          {isExpanded && node.children && (
            <div>
              {node.children.map(child => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <ContextMenu key={node.path}>
        <ContextMenuTrigger>
          <div
            className={`flex items-center gap-1 py-1 px-2 text-sm cursor-pointer hover-elevate ${
              isSelected ? 'bg-accent' : ''
            }`}
            style={{ paddingLeft: `${paddingLeft}px` }}
            onClick={() => onFileSelect(node)}
            data-testid={`file-${node.name}`}
          >
            <File className="h-3 w-3 flex-shrink-0 text-muted-foreground ml-4" />
            <span className="truncate">{node.name}</span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => handleContextMenu('Rename', node)} data-testid="context-rename-file">
            <Edit2 className="h-3 w-3 mr-2" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleContextMenu('Delete', node)} data-testid="context-delete-file">
            <Trash2 className="h-3 w-3 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  const filterFiles = (nodes: FileNode[], query: string): FileNode[] => {
    if (!query) return nodes;
    return nodes.filter(node => {
      if (node.name.toLowerCase().includes(query.toLowerCase())) return true;
      if (node.children) {
        return filterFiles(node.children, query).length > 0;
      }
      return false;
    });
  };

  const filteredFiles = filterFiles(files, searchQuery);

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 border-b">
        <Input
          type="search"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 text-xs"
          data-testid="input-file-search"
        />
      </div>
      <ScrollArea className="flex-1">
        <div className="py-1">
          {filteredFiles.map(node => renderNode(node))}
        </div>
      </ScrollArea>
    </div>
  );
}
