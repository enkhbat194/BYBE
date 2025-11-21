import FileTree from '../FileTree';
import type { FileNode } from '@shared/schema';

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
          { id: '3', name: 'App.tsx', type: 'file', path: '/src/components/App.tsx' },
          { id: '4', name: 'Header.tsx', type: 'file', path: '/src/components/Header.tsx' },
        ],
      },
      { id: '5', name: 'index.ts', type: 'file', path: '/src/index.ts' },
      { id: '6', name: 'utils.ts', type: 'file', path: '/src/utils.ts' },
    ],
  },
  {
    id: '7',
    name: 'public',
    type: 'folder',
    path: '/public',
    children: [
      { id: '8', name: 'index.html', type: 'file', path: '/public/index.html' },
    ],
  },
  { id: '9', name: 'package.json', type: 'file', path: '/package.json' },
  { id: '10', name: 'README.md', type: 'file', path: '/README.md' },
];

export default function FileTreeExample() {
  return (
    <div className="h-96 border rounded-md">
      <FileTree
        files={mockFiles}
        onFileSelect={(file) => console.log('Selected:', file.name)}
        selectedPath="/src/components/App.tsx"
      />
    </div>
  );
}
