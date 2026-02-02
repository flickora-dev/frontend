import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { chatAPI } from '../api/chat';
import { Send, Download, Trash2, RotateCw, MessageCircle, Sparkles, LogIn, StopCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { cn } from '../lib/utils';
import useAuthStore from '../store/authStore';

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isResponseStopped, setIsResponseStopped] = useState(false);
  const conversationIdRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isMutatingRef = useRef(false);

  const [quickSuggestions, setQuickSuggestions] = useState([
    "Recommend a thriller",
    "Explain Inception",
    "Best 2023 movies"
  ]);

  const allSuggestions = [
    "Recommend a thriller",
    "Explain Inception",
    "Best 2023 movies",
    "Best sci-fi movies",
    "Movies like Interstellar",
    "Top rated comedies",
    "Classic horror films",
    "Movies with plot twist",
    "Best actor performances",
    "Hidden gem movies",
    "Animated masterpieces",
    "Documentary recommendations"
  ];

  const sendMessageMutation = useMutation({
    mutationFn: (message) => {
      // Prevent double calls (React StrictMode)
      if (isMutatingRef.current) {
        return Promise.reject(new Error('Already mutating'));
      }
      isMutatingRef.current = true;
      abortControllerRef.current = new AbortController();
      setIsResponseStopped(false);
      return chatAPI.sendMessage(message, null, conversationIdRef.current, abortControllerRef.current.signal);
    },
    onSuccess: (response) => {
      isMutatingRef.current = false;
      if (isResponseStopped) return;

      // Save conversation_id for subsequent messages
      if (response.data.conversation_id) {
        conversationIdRef.current = response.data.conversation_id;
        setConversationId(response.data.conversation_id);
      }

      const aiMessage = {
        role: 'assistant',
        content: response.data.message,
        sources: response.data.sources,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      };
      setMessages(prev => [...prev, aiMessage]);

      // Invalidate conversations query to update Recent Chats page
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', response.data.conversation_id] });
    },
    onError: (error) => {
      isMutatingRef.current = false;
      // Ignore "Already mutating" errors from StrictMode double-calls
      if (error.message === 'Already mutating') return;

      if (error.name === 'CanceledError' || isResponseStopped) {
        // Request was cancelled by user
        const stoppedMessage = {
          role: 'assistant',
          content: t('chat.responseStopped'),
          isStopped: true,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
        };
        setMessages(prev => [...prev, stoppedMessage]);
        return;
      }
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'assistant',
        content: t('chat.errorMessage'),
        isError: true,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleStopResponse = () => {
    if (abortControllerRef.current) {
      setIsResponseStopped(true);
      abortControllerRef.current.abort();
    }
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sendMessageMutation.isPending]);

  // Handle initial question from navigation state (e.g., from home page)
  const initialQuestionHandled = useRef(false);
  useEffect(() => {
    if (location.state?.initialQuestion && !initialQuestionHandled.current) {
      initialQuestionHandled.current = true;
      const userMessage = {
        role: 'user',
        content: location.state.initialQuestion,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      };
      setMessages([userMessage]);
      sendMessageMutation.mutate(location.state.initialQuestion);
      // Clear the state to prevent re-triggering on navigation
      window.history.replaceState({}, document.title);
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
    setConversationId(null);
    conversationIdRef.current = null;
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

  const handleRefreshSuggestions = () => {
    // Shuffle and pick 3 random suggestions
    const shuffled = [...allSuggestions].sort(() => Math.random() - 0.5);
    setQuickSuggestions(shuffled.slice(0, 3));
  };

  // Login required check
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem-4rem)] md:h-[calc(100vh-4rem)] max-h-screen overflow-hidden">
        <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto w-full p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <MessageCircle className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t('chat.loginRequired')}</h1>
          <p className="text-muted-foreground mb-6">
            {t('chat.pleaseLoginToChat')}
          </p>
          <Button onClick={() => navigate('/login')} className="gap-2">
            <LogIn className="w-4 h-4" />
            {t('common.goToLogin')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem-4rem)] md:h-[calc(100vh-4rem)] max-h-screen overflow-hidden">
      <div className="flex flex-col h-full max-w-5xl mx-auto w-full overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center gap-2 p-3 md:p-4 border-b bg-background/95 backdrop-blur">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold truncate">{t('chat.globalMovieChat')}</h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                {t('chat.askAnythingAboutMovies')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2 text-sm text-green-500 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              {t('chat.aiOnline')}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportChat}
              disabled={messages.length === 0}
              className="gap-2 h-8 md:h-9"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{t('chat.export')}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              disabled={messages.length === 0}
              className="gap-2 h-8 md:h-9"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t('chat.clear')}</span>
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
                <h2 className="text-xl font-semibold">{t('chat.hiImYourMovieAI')}</h2>
                <p className="text-muted-foreground">{t('chat.askMeAnythingAboutMovies')}</p>
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
        <div className="flex-shrink-0 p-3 md:p-6 border-t bg-background/95 backdrop-blur space-y-2 md:space-y-3">
          {messages.length === 0 && (
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
                onClick={handleRefreshSuggestions}
                disabled={sendMessageMutation.isPending}
                className="px-2"
                title={t('chat.refreshSuggestions')}
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder={t('chat.askAboutMoviesPlaceholder')}
              disabled={sendMessageMutation.isPending}
              className="flex-1"
            />
            {sendMessageMutation.isPending ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleStopResponse}
                title={t('chat.stopResponse')}
              >
                <StopCircle className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!chatMessage.trim()}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
              </Button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;