import ResizablePanel from './ResizablePanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AIChat from './AIChat';
import { useIDEStore } from '@/lib/store';

export default function RightSidebar() {
  const { rightPanelWidth, setRightPanelWidth } = useIDEStore();

  return (
    <ResizablePanel
      defaultSize={rightPanelWidth}
      minSize={280}
      maxSize={500}
      side="right"
      onResize={setRightPanelWidth}
    >
      <div className="right-sidebar h-full border-l">
        <Tabs defaultValue="ai" className="h-full flex flex-col">
          <TabsList className="w-full rounded-none border-b h-10 justify-start px-2">
            <TabsTrigger value="ai" className="text-xs">
              AI Chat
            </TabsTrigger>
          </TabsList>
          <TabsContent value="ai" className="flex-1 mt-0 overflow-hidden">
            <AIChat />
          </TabsContent>
        </Tabs>
      </div>
    </ResizablePanel>
  );
}
