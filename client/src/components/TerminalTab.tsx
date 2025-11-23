import { useEffect, useState, useRef } from "react";
import { Terminal as TerminalIcon, Trash2, Play } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import TerminalSocket from "@/lib/TerminalSocket";

export default function TerminalTab() {
  const [output, setOutput] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<TerminalSocket | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const socket = useRef<TerminalSocket>();

  useEffect(() => {
    socket.current = new TerminalSocket();
    socketRef.current = socket.current;

    socket.current.connect().then(() => {
      setOutput(['[Terminal] Connected to shell']);
    }).catch((err) => {
      setOutput([`[Terminal] Connection failed: ${err}`]);
    });

    socket.current.onOutput((data, type) => {
      const lines = data.split('\n').filter(l => l.trim());
      setOutput(prev => [...prev, ...lines.map(l => {
        if (type === 'stderr') return `[ERR] ${l}`;
        if (type === 'exit') return `[EXIT] ${l}`;
        return l;
      })]);
    });

    return () => {
      socket.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket.current?.isConnected()) return;

    const cmd = input.trim();
    socket.current.sendInput(cmd);
    setHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const handleClear = () => {
    socket.current?.clear();
    setOutput([]);
  };

  const handleKill = () => {
    socket.current?.kill();
    setOutput(prev => [...prev, '[Terminal] Process killed']);
  };
    help: () => {
      batchOutput([
        "📖 Available Commands:",
        "  help             → Show help",
        "  clear            → Clear screen",
        "  ls               → List files",
        "  status           → Show IDE status",
        "  theme            → Show theme",
        "  tabs             → List open tabs",
        "  ai explain       → Explain active file",
        "  ai fix           → Fix code",
        "  ai rewrite       → Rewrite code better",
      ]);
    },

    clear: () => clearTerminal(),

    ls: () => {
      const fileList = files.filter(f => f.type === "file");
      if (fileList.length === 0) return addTerminalOutput("(empty)");
      fileList.forEach((file) => addTerminalOutput("📄 " + file.name));
    },

    status: () => {
      batchOutput([
        "📊 IDE Status:",
        `  Theme: ${theme}`,
        `  Files: ${files.length}`,
        `  Tabs: ${tabs.length}`,
        "  Terminal: Running",
      ]);
    },

    theme: () => {
      addTerminalOutput(`🎨 Current theme: ${theme}`);
    },

    tabs: () => {
      if (tabs.length === 0) return addTerminalOutput("No open tabs");
      tabs.forEach((t) => addTerminalOutput(`📄 ${t.name} (${t.language})`));
    },

    ai: (args) => {
      const action = args[0];
      if (!action) return errorOut("Usage: ai <explain|fix|rewrite>");

      const { activeTabId } = useIDEStore.getState();
      const activeTab = tabs.find((t) => t.id === activeTabId);
      
      if (!activeTab || activeTab.id === 'terminal') return errorOut("No code file active");

      // Note: AI logic would trigger chat here
      addTerminalOutput(`🤖 AI ${action}: ${activeTab.name}`);
      success(`AI processing: ${action}...`);
    },
  };

  const autoComplete = (input: string): string | null => {
    const list = Object.keys(commands);
    const match = list.find((cmd) => cmd.startsWith(input));
    return match || null;
  };

  const handleCommand = (cmd: string) => {
    addTerminalOutput(`$ ${cmd}`);

    if (!cmd.trim()) return;

    setHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);

    const parts = cmd.split(" ");
    const base = parts[0].toLowerCase();
    const args = parts.slice(1);

    const handler = commands[base];

    if (!handler) {
      errorOut(`Unknown command: ${base}`);
      const suggestion = autoComplete(base);
      if (suggestion) addTerminalOutput(`Did you mean: ${suggestion}?`);
      return;
    }

  // Remove all fake command logic


  return (
    <div className="h-full flex flex-col bg-card font-mono text-xs">
      {/* HEADER */}
      <div className="p-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${socket.current?.isConnected() ? 'bg-emerald-500 animate-pulse' : 'bg-destructive'}`}></div>
          <TerminalIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            Terminal {socket.current?.isConnected() ? '(Connected)' : '(Disconnected)'}
          </span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleClear}
            title="Clear"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleKill}
            title="Kill Process"
          >
            <Play className="h-3 w-3 rotate-90" />
          </Button>
        </div>
      </div>

      {/* OUTPUT */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-1">
          {output.length === 0 ? (
            <div className="text-muted-foreground">
              <p>$ Connecting to shell...</p>
            </div>
          ) : (
            output.map((line, i) => (
              <div
                key={i}
                className={`${
                  line.includes('[ERR]') || line.includes('[EXIT]') ? 'text-destructive' : 'text-foreground'
                }`}
              >
                {line}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* INPUT */}
      <form onSubmit={handleSubmit} className="p-2 border-t flex gap-2 items-center">
        <div className="flex-1 flex items-center gap-1 bg-muted rounded-md px-2">
          <span className="text-primary">$</span>
          <Input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command..."
            className="flex-1 bg-transparent border-0 outline-none py-1.5 placeholder:text-muted-foreground"
            autoFocus
          />
        </div>
        <Button type="submit" size="icon" className="h-8 w-8">
          <Play className="h-3 w-3" />
        </Button>
      </form>
    </div>
  );
}