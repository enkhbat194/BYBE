import React, { useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreviewProps {
  htmlCode: string;
  cssCode: string;
  jsCode: string;
}

export default function Preview({ htmlCode, cssCode, jsCode }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const iframeContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>${cssCode}</style>
      </head>
      <body>${htmlCode}</body>
      <script>${jsCode}<\/script>
    </html>
  `;

  const reloadPreview = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      <div className="p-2 border-b flex items-center justify-between">
        <h3 className="text-sm font-medium">Preview</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={reloadPreview}>
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
      <iframe
        ref={iframeRef}
        srcDoc={iframeContent}
        title="Live Preview"
        className="flex-1 w-full border-0"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
