import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { chatAPI } from '../api/chat';
import { Send, Download, Trash2, RotateCw, MessageCircle, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { cn } from '../lib/utils';

const Chat = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesContainerRef = useRef(null);

  const quickSuggestions = [
    "Recommend a thriller",
    "Explain Inception",
    "Best 2023 movies"
  ];

  const sendMessageMutation = useMutation({
    mutationFn: (message) => chatAPI.sendMessage(message, null),
    onSuccess: (response) => {
      const aiMessage = {
        role: 'assistant',
        content: response.data.message,
        sources: response.data.sources,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      };
      setMessages(prev => [...prev, aiMessage]);

      // Invalidate conversations query to update Recent Chats page
      queryClient.invalidateQueries(['conversations']);
      queryClient.invalidateQueries(['conversation', response.data.conversation_id]);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        isError: true,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sendMessageMutation.isPending]);

  useEffect(() => {
    if (location.state?.initialQuestion) {
      const userMessage = {
        role: 'user',
        content: location.state.initialQuestion,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      };
      setMessages([userMessage]);
      sendMessageMutation.mutate(location.state.initialQuestion);
    }
  }, [location.state]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatMessage.trim() && !sendMessageMutation.isPending) {
      const userMessage = {
        role: 'user',
        content: chatMessage.trim(),
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      };
      setMessages(prev => [...prev, userMessage]);
      sendMessageMutation.mutate(chatMessage.trim());
      setChatMessage('');
    }
  };

  const handleQuickSuggestion = (suggestion) => {
    if (!sendMessageMutation.isPending) {
      const userMessage = {
        role: 'user',
        content: suggestion,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      };
      setMessages(prev => [...prev, userMessage]);
      sendMessageMutation.mutate(suggestion);
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
  };

  const handleExportChat = () => {
    const chatText = messages.map(m => `[${m.timestamp}] ${m.role}: ${m.content}`).join('\n\n');
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString()}.txt`;
    a.click();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]">
      <div className="flex flex-col h-full max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-4 md:p-6 border-b bg-background/95 backdrop-blur">
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-primary" />
              Global Movie Chat
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ask anything about movies, get instant AI responses
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-green-500 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              AI Online
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportChat}
              disabled={messages.length === 0}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              disabled={messages.length === 0}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Hi! I'm your movie AI assistant</h2>
                <p className="text-muted-foreground">Ask me anything about movies!</p>
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-md bg-card border flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "flex flex-col gap-1",
                  msg.role === 'user' ? 'items-end' : 'items-start',
                  "max-w-[85%] md:max-w-[70%]"
                )}
              >
                <Card
                  className={cn(
                    "p-3 md:p-4",
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : msg.isError
                      ? 'bg-card border-destructive text-destructive'
                      : 'bg-card border'
                  )}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="my-2 ml-4 list-disc">{children}</ul>,
                        ol: ({ children }) => <ol className="my-2 ml-4 list-decimal">{children}</ol>,
                        li: ({ children }) => <li className="my-1">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </Card>
                <span className="text-xs text-muted-foreground px-1">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {sendMessageMutation.isPending && (
            <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-8 h-8 rounded-md bg-card border flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <Card className="p-4 bg-card border">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce"></span>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 md:p-6 border-t bg-background/95 backdrop-blur space-y-3">
          <div className="flex gap-2 flex-wrap">
            {quickSuggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="secondary"
                size="sm"
                onClick={() => handleQuickSuggestion(suggestion)}
                disabled={sendMessageMutation.isPending}
                className="text-xs"
              >
                {suggestion}
              </Button>
            ))}
            <Button
              variant="secondary"
              size="sm"
              disabled={sendMessageMutation.isPending}
              className="px-2"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ask about movies..."
              disabled={sendMessageMutation.isPending}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!chatMessage.trim() || sendMessageMutation.isPending}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;