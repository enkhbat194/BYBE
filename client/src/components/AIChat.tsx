import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Settings,
  Copy,
  Check,
  Sparkles,
  Trash2,
  Bot,
  User,
} from 'lucide-react';

import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { useIDEStore } from '../lib/store';
import { useAIConfigStore } from '../lib/aiConfig';
import { useToast } from '../hooks/use-toast';
import type { AIMessage, AIProviderName } from '@shared/schema';
import type { UnifiedChunk } from '../lib/aiStreaming';
import AISettings from './AISettings';
import { api } from '../lib/api';

export default function AIChat() {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const scrollEndRef = useRef<HTMLDivElement>(null);

  const { messages, addMessage, clearMessages, loadMessages } = useIDEStore();
  const {
    selectedProviderId,
    selectedModelId,
    apiKeys,
    advancedSettings,
  } = useAIConfigStore();

  const { toast } = useToast();

  const apiKey = apiKeys[selectedProviderId] || '';

  // Auto-update message count
  const messageCount = messages.length;

  useEffect(() => {
    loadMessages();
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (scrollEndRef.current) {
        scrollEndRef.current.scrollIntoView({
          behavior: 'smooth',
        });
      }
    });
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

  // ------------------------------
  // SEND MESSAGE
  // ------------------------------
  const handleSendMessage = async () => {
    if (!message.trim()) return;

    if (!apiKey) {
      toast({
        title: 'API Key Missing',
        description: `Please add the API key for ${selectedProviderId}.`,
        variant: 'destructive',
      });
      return;
    }

    if (!selectedModelId) {
      toast({
        title: 'Model Missing',
        description: 'Please select a model in settings.',
        variant: 'destructive',
      });
      return;
    }

    // User message
    const userMsg: AIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message.trim(),
      timestamp: Date.now(),
    };

    addMessage(userMsg);
    setMessage('');
    setIsSending(true);

    // Placeholder for assistant
    const assistantId = crypto.randomUUID();

    addMessage({
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    });

    setIsStreaming(true);

    try {
      if (advancedSettings.streamResponse) {
        await handleStream(userMsg.content, assistantId);
      } else {
        await handleFullResponse(userMsg.content, assistantId);
      }
    } catch (err) {
      toast({
        title: 'AI Error',
        description:
          err instanceof Error ? err.message : 'Failed to get AI response.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
      setIsStreaming(false);
    }
  };

  // ------------------------------
  // STREAM MODE
  // ------------------------------
  const handleStream = async (prompt: string, assistantId: string) => {
    const stream = await api.sendAIStreamMessage(
      prompt,
      selectedProviderId as AIProviderName,
      apiKey,
      selectedModelId!,
      advancedSettings
    );

    if (!stream) {
      toast({
        title: 'Streaming Error',
        description: 'Failed to start streaming response.',
        variant: 'destructive',
      });
      return;
    }

    let accumulated = '';
    let isComplete = false;

    try {
      const reader = stream.getReader();
      
      while (!isComplete) {
        const { done, value } = await reader.read();
        
        if (done) {
          isComplete = true;
          break;
        }

        if (value) {
          const chunk = value as UnifiedChunk;
          
          switch (chunk.type) {
            case 'content':
              if (chunk.text) {
                accumulated += chunk.text;
                
                // Atomic update to avoid expensive array cloning
                useIDEStore.setState((prev) => ({
                  messages: prev.messages.map((m) =>
                    m.id === assistantId ? { ...m, content: accumulated } : m
                  ),
                }));
              }
              break;
              
            case 'error':
              toast({
                title: 'Streaming Error',
                description: chunk.error || 'An error occurred during streaming.',
                variant: 'destructive',
              });
              isComplete = true;
              break;
              
            case 'done':
              // Streaming completed successfully
              isComplete = true;
              break;
          }
        }
      }
    } catch (error) {
      toast({
        title: 'Stream Error',
        description: error instanceof Error ? error.message : 'Failed to stream response.',
        variant: 'destructive',
      });
    }
  };

  // ------------------------------
  // NON-STREAM MODE
  // ------------------------------
  const handleFullResponse = async (prompt: string, assistantId: string) => {
    const text = await api.sendAIMessage(
      prompt,
      selectedProviderId as AIProviderName,
      apiKey,
      selectedModelId!,
      advancedSettings
    );

    useIDEStore.setState((prev) => ({
      messages: prev.messages.map((m) =>
        m.id === assistantId ? { ...m, content: text } : m
      ),
    }));
  };

  // ------------------------------
  // COPY MESSAGE
  // ------------------------------
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 1500);
    } catch {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy this message.',
        variant: 'destructive',
      });
    }
  };

  // ------------------------------
  // UI RENDER
  // ------------------------------
  return (
    <div className="flex flex-col h-full">
      {/* HEADER */}
      <div className="flex justify-between items-center px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary w-5 h-5" />
          <span className="font-semibold">AI Assistant</span>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
            {messageCount} messages
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={messages.length === 0}
            onClick={() => {
              clearMessages();
              toast({
                title: 'Chat cleared',
                description: 'Conversation was reset.',
              });
            }}
          >
            <Trash2 className="w-4 h-4 mr-1" /> Clear
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings((v) => !v)}
          >
            <Settings className="w-4 h-4 mr-1" /> Settings
          </Button>
        </div>
      </div>

      {/* SETTINGS PANEL */}
      {showSettings && (
        <div className="border-b p-4">
          <AISettings />
        </div>
      )}

      {/* MESSAGES */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`p-1 rounded-full ${
                      msg.role === 'user'
                        ? 'bg-primary-foreground/20'
                        : 'bg-primary/20'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <User className="w-3 h-3" />
                    ) : (
                      <Bot className="w-3 h-3" />
                    )}
                  </div>

                  <span className="text-xs">{msg.role === 'user' ? 'You' : 'AI'}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(msg.timestamp)}
                  </span>

                  {msg.role === 'assistant' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                    >
                      {copiedMessageId === msg.id ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  )}
                </div>

                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}

          {/* LOADING BUBBLES */}
          {isStreaming && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-card border">
                <div className="flex gap-2 items-center mb-1">
                  <Bot className="w-3 h-3 text-primary" />
                  <span className="text-xs">AI</span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(Date.now())}
                  </span>
                </div>

                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={scrollEndRef} />
        </div>
      </ScrollArea>

      {/* INPUT AREA */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            placeholder="Type your message…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="resize-none flex-1"
          />

          <Button onClick={handleSendMessage} disabled={!message.trim() || isSending}>
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {advancedSettings.streamResponse && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            Streaming enabled — responses will appear live
          </p>
        )}
      </div>
    </div>
  );
}
