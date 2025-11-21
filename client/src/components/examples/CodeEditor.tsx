import CodeEditor from '../CodeEditor';
import type { EditorTab } from '@shared/schema';
import { useState } from 'react';

const mockTabs: EditorTab[] = [
  {
    id: '1',
    path: '/src/App.tsx',
    name: 'App.tsx',
    language: 'typescript',
    content: `import React from 'react';\n\nfunction App() {\n  return (\n    <div className="app">\n      <h1>Hello Bybe IDE!</h1>\n    </div>\n  );\n}\n\nexport default App;`,
    modified: false,
  },
  {
    id: '2',
    path: '/src/utils.ts',
    name: 'utils.ts',
    language: 'typescript',
    content: `export function formatDate(date: Date): string {\n  return date.toLocaleDateString();\n}\n\nexport function capitalize(str: string): string {\n  return str.charAt(0).toUpperCase() + str.slice(1);\n}`,
    modified: true,
  },
];

export default function CodeEditorExample() {
  const [tabs, setTabs] = useState(mockTabs);
  const [activeTabId, setActiveTabId] = useState('1');

  return (
    <div className="h-[600px] border rounded-md overflow-hidden">
      <CodeEditor
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={setActiveTabId}
        onTabClose={(id) => setTabs(tabs.filter(t => t.id !== id))}
        onContentChange={(id, content) =>
          setTabs(tabs.map(t => (t.id === id ? { ...t, content, modified: true } : t)))
        }
      />
    </div>
  );
}
