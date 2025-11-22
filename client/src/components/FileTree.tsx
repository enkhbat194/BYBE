// client/src/components/FileTree.tsx - SIMPLE VERSION
import React from 'react';

interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

interface FileTreeProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  selectedPath?: string;
}

export default function FileTree({ files, onFileSelect, selectedPath }: FileTreeProps) {
  const renderFile = (file: FileNode) => {
    const isSelected = selectedPath === file.path;
    
    if (file.type === 'folder') {
      return (
        <div key={file.id} className="folder">
          <div className="folder-name">📁 {file.name}</div>
          {file.children && (
            <div className="folder-children pl-4">
              {file.children.map(renderFile)}
            </div>
          )}
        </div>
      );
    }

    return (
      <div 
        key={file.id}
        className={`file ${isSelected ? 'bg-blue-500 text-white' : 'hover:bg-gray-700'}`}
        onClick={() => onFileSelect(file)}
      >
        📄 {file.name}
      </div>
    );
  };

  return (
    <div className="file-tree p-4">
      <h3 className="text-lg font-bold mb-4">Files</h3>
      {files.map(renderFile)}
    </div>
  );
}