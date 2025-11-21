import { Code2, Settings, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ThemeToggle from './ThemeToggle';
import { useIDEStore } from '@/lib/store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const AI_PROVIDERS = [
  { id: 'openai', name: 'OpenAI GPT-4' },
  { id: 'anthropic', name: 'Anthropic Claude' },
  { id: 'groq', name: 'Groq LLaMA' },
  { id: 'openrouter', name: 'OpenRouter' },
  { id: 'together', name: 'Together AI' },
  { id: 'ollama', name: 'Ollama (Local)' },
];

export default function TopBar() {
  const { aiProvider, setAIProvider } = useIDEStore();

  return (
    <div className="h-14 border-b flex items-center justify-between px-4 bg-background">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold">Bybe</span>
        </div>
        <div className="h-6 w-px bg-border" />
        <span className="text-sm text-muted-foreground" data-testid="text-project-name">
          My Project
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Select value={aiProvider} onValueChange={setAIProvider}>
          <SelectTrigger className="w-[180px] h-9" data-testid="select-ai-provider">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AI_PROVIDERS.map((provider) => (
              <SelectItem key={provider.id} value={provider.id} data-testid={`option-${provider.id}`}>
                {provider.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ThemeToggle />

        <Button variant="ghost" size="icon" data-testid="button-settings">
          <Settings className="h-4 w-4" />
        </Button>

        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">BY</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
