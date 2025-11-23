// IDEPage.tsx — CLEAN VERSION

import { useEffect } from "react";
import TopBar from "@/components/TopBar";
import MainContent from "@/components/MainContent";
import { useIDEStore } from "@/lib/store";

export default function IDEPage() {
  const { setTheme } = useIDEStore();

  useEffect(() => {
    setTheme("dark");
  }, [setTheme]);

  return (
    <div className="replit-ide w-full h-full flex flex-col overflow-hidden">
      <TopBar />
      <MainContent />
    </div>
  );
}
