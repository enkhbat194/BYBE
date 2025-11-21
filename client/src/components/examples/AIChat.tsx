import AIChat from '../AIChat';
import type { AIMessage } from '@shared/schema';
import { useState } from 'react';

const mockMessages: AIMessage[] = [
  {
    id: '1',
    role: 'user',
    content: 'Can you explain how React hooks work?',
    timestamp: Date.now() - 300000,
  },
  {
    id: '2',
    role: 'assistant',
    content: 'React Hooks are functions that let you use state and other React features in functional components. The most common hooks are useState for managing state and useEffect for side effects.',
    timestamp: Date.now() - 240000,
  },
  {
    id: '3',
    role: 'user',
    content: 'How do I optimize performance?',
    timestamp: Date.now() - 120000,
  },
];

export default function AIChatExample() {
  const [messages, setMessages] = useState(mockMessages);

  const handleSend = (content: string) => {
    const newMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    setMessages([...messages, newMessage]);
    
    setTimeout(() => {
      const aiResponse: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Great question! Let me help you with that...',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className="h-[600px] border rounded-md">
      <AIChat messages={messages} onSendMessage={handleSend} />
    </div>
  );
}
