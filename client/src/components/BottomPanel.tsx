import { useEffect, useRef, useState } from "react";
import ResizablePanel from "./ResizablePanel";
import Terminal from "./Terminal";
import { useIDEStore } from "@/lib/store";

export default function BottomPanel() {
  const {
    showTerminal,
    terminalHeight,
    setTerminalHeight,
    terminalOutput,
    addTerminalOutput,
    clearTerminal,
    tabs,
    files,
    theme,
    addMessage,
  } = useIDEStore();

  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  /** -------------------------
   *  Utilities
   *  ------------------------- */

  const batchOutput = (lines: string[]) => {
    lines.forEach((l) => addTerminalOutput(l));
  };

  const errorOut = (msg: string) => {
    addTerminalOutput(`❌ ${msg}`);
  };

  const success = (msg: string) => {
    addTerminalOutput(`✅ ${msg}`);
  };

  /** -------------------------
   *  CORE COMMAND HANDLERS
   *  ------------------------- */

  const commands: Record<string, (args: string[]) => void> = {
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
      batchOutput(tabs.map((t) => `📄 ${t.name} (${t.language})`));
    },

    /** AI COMMANDS */
    ai: (args) => {
      const action = args[0];
      if (!action) return errorOut("Usage: ai <explain|fix|rewrite>");

      const { activeTabId } = useIDEStore.getState();
      const active = tabs.find((t) => t.id === activeTabId);
      
      if (!active) return errorOut("No active file selected");

      addMessage({
        id: crypto.randomUUID(),
        role: "user",
        timestamp: Date.now(),
        content: `[AI COMMAND: ${action}] → ${active.name}`,
      });

      success(`AI processing: ${action}...`);
    },
  };

  /** -------------------------
   *  AUTOCOMPLETE
   *  ------------------------- */
  const autoComplete = (input: string): string | null => {
    const list = Object.keys(commands);
    const match = list.find((cmd) => cmd.startsWith(input));
    return match || null;
  };

  /** -------------------------
   *  HANDLE TERMINAL INPUT
   *  ------------------------- */
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

    handler(args);
  };

  /** -------------------------
   *  WELCOME MESSAGE
   *  ------------------------- */
  useEffect(() => {
    if (showTerminal && terminalOutput.length === 0) {
      batchOutput([
        "🌈 Welcome to BYBE PRO Terminal",
        "Type 'help' to explore commands.",
        "",
      ]);
    }
  }, [showTerminal, terminalOutput.length]);

  if (!showTerminal) return null;

  return (
    <ResizablePanel
      defaultSize={terminalHeight}
      minSize={120}
      maxSize={500}
      side="bottom"
      onResize={setTerminalHeight}
    >
      <div className="bottom-panel w-full h-full flex flex-col border-t border-border bg-background/90">

        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-sm font-semibold text-foreground">Terminal (PRO)</span>
          </div>
          <span className="text-xs text-muted-foreground">{history.length} cmds</span>
        </div>

        {/* TERMINAL */}
        <Terminal
          output={terminalOutput}
          onCommand={handleCommand}
          onClear={clearTerminal}
        />

        {/* FOOTER */}
        <div className="px-4 py-1 border-t border-border bg-background/60">
          <p className="text-xs text-center text-muted-foreground">
            PRO Shell active — type "help"
          </p>
        </div>
      </div>
    </ResizablePanel>
  );
}