// FileTree.tsx - ЯГ ЗУРАГ ДЭЭРХ ШИГ
import React, { useState, useCallback, useMemo } from "react";

interface FileNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
}

interface FileTreeProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  selectedPath?: string;
  className?: string;
}

export default function FileTree({
  files,
  onFileSelect,
  selectedPath,
  className = "",
}: FileTreeProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<{ [key: string]: boolean }>({});

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !(prev[folderId] ?? false),
    }));
  }, []);

  const filteredFiles = useMemo((): FileNode[] => {
    const searchLower = searchTerm.toLowerCase();
    if (!searchLower) return files;

    const filterNode = (node: FileNode): FileNode | null => {
      const matches = node.name.toLowerCase().includes(searchLower);
      if (matches || node.type === "folder") {
        const filteredChildren = node.children
          ?.map(filterNode)
          .filter((child): child is FileNode => child !== null) || [];
        if (matches || filteredChildren.length > 0) {
          return {
            ...node,
            children: filteredChildren.length > 0 ? filteredChildren : undefined,
          };
        }
      }
      return null;
    };

    return files
      .map(filterNode)
      .filter((node): node is FileNode => node !== null);
  }, [files, searchTerm]);

  const renderNode = (node: FileNode, depth = 0): React.ReactNode => {
    const isSelected = selectedPath === node.path;
    const isFolder = node.type === "folder";
    const paddingLeft = `${depth * 16 + 8}px`;
    const isExpanded = expandedFolders[node.id] ?? false;

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isFolder) {
        toggleFolder(node.id);
      } else {
        onFileSelect(node);
      }
    };

    const nodeRow = (
      <div
        key={node.id}
        className={`
          flex items-center py-1 px-2 cursor-pointer transition-colors text-[13px] font-normal
          ${isSelected
            ? 'bg-blue-600 text-white'
            : 'hover:bg-gray-700 text-gray-300'
          }
        `}
        style={{ paddingLeft }}
        onClick={handleClick}
      >
        {isFolder && (
          <svg
            className={`w-3 h-3 mr-1 transition-transform duration-200 ${
              isExpanded ? 'rotate-90' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        )}
        <span className="mr-2 w-4 flex items-center justify-center">
          {isFolder ? '📁' : '📄'}
        </span>
        <span className="truncate flex-1">{node.name}</span>
      </div>
    );

    if (!isFolder || !isExpanded || !node.children?.length) {
      return nodeRow;
    }

    return (
      <>
        {nodeRow}
        <div style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}>
          {node.children.map((child) => renderNode(child, depth + 1))}
        </div>
      </>
    );
  };


  return (
    <div className={`flex flex-col h-full bg-[#252526] text-[#cccccc] ${className}`}>
      {/* Files Section */}
      <div className="flex-1 overflow-auto">
        {/* Files Header */}
        <div className="p-3 border-b border-[#333333]">
          <h3 className="text-[13px] font-semibold mb-2">Files</h3>
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 text-[13px] bg-[#3c3c3c] border border-[#464647] rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          {/* Files List */}
          <div className="space-y-0">
            {filteredFiles.map((file: FileNode) => renderNode(file))}
          </div>
        </div>


      </div>
    </div>
  );
}