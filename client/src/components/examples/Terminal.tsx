import Terminal from '../Terminal';
import { useState } from 'react';

const mockOutput = [
  '$ npm install',
  'Installing dependencies...',
  '✓ Dependencies installed successfully',
  '$ npm run dev',
  'Starting development server...',
  'Server running on http://localhost:5000',
];

export default function TerminalExample() {
  const [output, setOutput] = useState(mockOutput);

  const handleCommand = (cmd: string) => {
    setOutput([...output, `$ ${cmd}`, `Executing: ${cmd}...`]);
  };

  return (
    <div className="h-96 border rounded-md overflow-hidden">
      <Terminal
        output={output}
        onCommand={handleCommand}
        onClear={() => setOutput([])}
      />
    </div>
  );
}
