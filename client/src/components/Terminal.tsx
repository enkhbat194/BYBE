import { useEffect, useRef, useState } from 'react';
import { Terminal as TerminalIcon, Trash2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TerminalProps {
  output: string[];
  onCommand?: (command: string) => void;
  onClear?: () => void;
}

export default function Terminal({ output, onCommand, onClear }: TerminalProps) {
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      onCommand?.(command.trim());
      setCommandHistory([...commandHistory, command]);
      setCommand('');
      setHistoryIndex(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="p-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Terminal</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClear}
          data-testid="button-clear-terminal"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3 font-mono text-xs" ref={scrollRef}>
        <div className="space-y-1">
          {output.length === 0 ? (
            <div className="text-muted-foreground">
              <p>$ Welcome to Bybe Terminal</p>
              <p>$ Type commands below...</p>
            </div>
          ) : (
            output.map((line, i) => (
              <div
                key={i}
                className={`${
                  line.startsWith('$') ? 'text-primary' : 'text-foreground'
                } ${line.includes('error') ? 'text-destructive' : ''}`}
                data-testid={`terminal-line-${i}`}
              >
                {line}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-2 border-t">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-1 bg-muted rounded-md px-2">
            <span className="text-xs font-mono text-primary">$</span>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command..."
              className="flex-1 bg-transparent border-0 outline-none text-xs font-mono py-1.5 placeholder:text-muted-foreground"
              data-testid="input-terminal-command"
            />
          </div>
          <Button type="submit" size="icon" className="h-8 w-8" data-testid="button-run-command">
            <Play className="h-3 w-3" />
          </Button>
        </div>
      </form>
    </div>
  );
}
