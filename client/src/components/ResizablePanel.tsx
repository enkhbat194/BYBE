import { useState, useRef, useEffect, ReactNode } from 'react';

interface ResizablePanelProps {
  children: ReactNode;
  defaultSize: number;
  minSize: number;
  maxSize: number;
  side: 'left' | 'right' | 'bottom';
  onResize?: (size: number) => void;
}

export default function ResizablePanel({
  children,
  defaultSize,
  minSize,
  maxSize,
  side,
  onResize,
}: ResizablePanelProps) {
  const [size, setSize] = useState(defaultSize);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;

      const rect = panelRef.current.getBoundingClientRect();
      let newSize;

      if (side === 'left') {
        newSize = e.clientX;
      } else if (side === 'right') {
        newSize = window.innerWidth - e.clientX;
      } else { // bottom
        newSize = window.innerHeight - e.clientY;
      }

      newSize = Math.max(minSize, Math.min(maxSize, newSize));
      setSize(newSize);
      onResize?.(newSize);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.body.style.cursor = side === 'bottom' ? 'row-resize' : 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, side, minSize, maxSize, onResize]);

  const style = side === 'bottom' 
    ? { height: `${size}px` } 
    : { width: `${size}px` };

  return (
    <div
      ref={panelRef}
      className={`relative ${side === 'bottom' ? '' : 'flex-shrink-0'}`}
      style={style}
    >
      {children}
      <div
        className={`absolute z-50 ${
          side === 'left' 
            ? 'right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400'
            : side === 'right'
            ? 'left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400'
            : 'left-0 right-0 top-0 h-2 cursor-row-resize hover:bg-blue-400'
        } transition-colors ${
          isResizing ? 'bg-blue-500' : 'bg-transparent'
        }`}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
      />
    </div>
  );
}