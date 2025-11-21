import { Code2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from './ThemeToggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useIDEStore } from '@/lib/store';

export default function TopBar() {
  const { theme } = useIDEStore();
  return (
    <div className={`h-14 border-b flex items-center justify-between px-4 ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-black'}`}>
      {/* Зүүн талын хэсэг */}
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

      {/* Баруун талын хэсэг */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        <Button variant="ghost" size="icon" data-testid="button-settings" className={theme === 'dark' ? 'text-white hover:bg-slate-800' : 'text-black hover:bg-gray-200'}>
          <Settings className="h-4 w-4" />
        </Button>

        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">BY</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
