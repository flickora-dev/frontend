import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatAPI } from '../../api/chat';
import { Send, Download, Film, Globe, Sparkles, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';

const ConversationView = ({ conversation }) => {
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [localMessages, setLocalMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessage, setTypingMessage] = useState('');
  const [typingMessageId, setTypingMessageId] = useState(null);
  const messagesContainerRef = useRef(null);

  // Sync local messages with conversation messages
  useEffect(() => {
    setLocalMessages(conversation.messages || []);
  }, [conversation.id, conversation.messages]);

  // Typing effect function
  const typeMessage = (message, messageId, index = 0) => {
    if (index < message.length) {
      setTypingMessage(prev => prev + message.charAt(index));
      setTimeout(() => typeMessage(message, messageId, index + 1), 15);
    } else {
      setIsTyping(false);
      setTypingMessage('');
      setTypingMessageId(null);
    }
  };

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (message) =>
      chatAPI.sendMessage(
        message,
        conversation.conversation_type === 'movie' ? conversation.movie?.id : null,
        conversation.id
      ),
    onMutate: async (messageText) => {
      // Add user message immediately to local state
      const userMessage = {
        id: Date.now(),
        role: 'user',
        content: messageText,
        created_at: new Date().toISOString(),
      };
      setLocalMessages(prev => [...prev, userMessage]);
      setNewMessage('');
    },
    onSuccess: (response) => {
      // Add AI message with typing effect
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.message,
        created_at: new Date().toISOString(),
      };

      setLocalMessages(prev => [...prev, aiMessage]);
      setTypingMessageId(aiMessage.id);
      setIsTyping(true);
      setTypingMessage('');
      typeMessage(response.data.message, aiMessage.id);

      // Invalidate and refetch queries to sync with backend
      queryClient.invalidateQueries({ queryKey: ['conversation', conversation.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.refetchQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString(),
        isError: true,
      };
      setLocalMessages(prev => [...prev, errorMessage]);
    },
  });

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, sendMessageMutation.isPending, typingMessage]);

  // Handle send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    const messageToSend = newMessage.trim();
    if (messageToSend && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(messageToSend);
    }
  };

  // Export conversation
  const handleExportConversation = () => {
    const chatText = localMessages
      .map(m => `[${new Date(m.created_at).toLocaleString()}] ${m.role}: ${m.content}`)
      .join('\n\n');

    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${conversation.id}-${new Date().toISOString()}.txt`;
    a.click();
  };

  // Format timestamp
  const formatTimestamp = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 md:p-6 border-b bg-background/95 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {conversation.conversation_type === 'movie' ? (
                <Film className="w-5 h-5 text-primary" />
              ) : (
                <Globe className="w-5 h-5 text-primary" />
              )}
              <h1 className="text-xl font-bold">
                {conversation.conversation_type === 'movie' && conversation.movie
                  ? conversation.movie.title
                  : 'Global Chat'}
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {new Date(conversation.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              <span>•</span>
              <span>{localMessages.length || 0} messages</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportConversation}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar"
      >
        {localMessages.map((msg, index) => (
          <div
            key={msg.id || index}
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
                    {msg.role === 'assistant' && isTyping && msg.id === typingMessageId
                      ? typingMessage
                      : msg.content}
                  </ReactMarkdown>
                </div>
              </Card>
              <span className="text-xs text-muted-foreground px-1">
                {formatTimestamp(msg.created_at)}
              </span>
            </div>
          </div>
        ))}

        {sendMessageMutation.isPending && !isTyping && (
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

      {/* Input */}
      <div className="flex-shrink-0 p-4 md:p-6 border-t bg-background/95 backdrop-blur">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Continue the conversation..."
            disabled={sendMessageMutation.isPending || isTyping}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || sendMessageMutation.isPending || isTyping}
            className="gap-2"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ConversationView;
