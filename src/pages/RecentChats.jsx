import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { chatAPI } from '../api/chat';
import { MessageCircle, Film, ChevronLeft, MessagesSquare } from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import ConversationView from '../components/chat/ConversationView';

const RecentChats = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [selectedConversation, setSelectedConversation] = useState(null);

  // Fetch conversations
  const { data: conversations, isLoading, refetch: refetchConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatAPI.getConversations(),
    staleTime: 0, // Always consider data stale
    refetchOnWindowFocus: true,
  });

  // Fetch conversation details when selected
  const { data: conversationDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['conversation', selectedConversation],
    queryFn: () => chatAPI.getConversation(selectedConversation),
    enabled: !!selectedConversation,
    staleTime: 0,
  });

  // Refetch conversations when conversation details change (after sending message)
  useEffect(() => {
    if (conversationDetails) {
      refetchConversations();
    }
  }, [conversationDetails, refetchConversations]);

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: (id) => chatAPI.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (selectedConversation) {
        setSelectedConversation(null);
        navigate('/recent');
      }
    },
  });

  // Handle conversation selection from URL
  useEffect(() => {
    if (conversationId && conversationId !== selectedConversation) {
      setSelectedConversation(conversationId);
    }
  }, [conversationId]);

  // Handle conversation click
  const handleConversationClick = (id) => {
    setSelectedConversation(id);
    navigate(`/recent/${id}`);
  };

  // Clear all conversations
  const handleClearAll = () => {
    if (window.confirm(t('recentChats.confirmDeleteAll'))) {
      conversations?.data?.forEach(conv => {
        deleteConversationMutation.mutate(conv.id);
      });
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return t('recentChats.timeAgo.minute', { count: minutes });
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return t('recentChats.timeAgo.hour', { count: hours });
    } else if (diffInHours < 168) {
      const days = Math.floor(diffInHours / 24);
      return t('recentChats.timeAgo.day', { count: days });
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get conversation preview text
  const getPreviewText = (conv) => {
    const lastMessage = conv.messages?.[conv.messages.length - 1];
    return lastMessage?.content?.substring(0, 60) + '...' || t('recentChats.noMessagesYet');
  };

  // Get conversation title
  const getConversationTitle = (conv) => {
    if (conv.conversation_type === 'movie' && conv.movie_title) {
      return conv.movie_title;
    }
    if (conv.conversation_type === 'global') {
      return t('recentChats.generalChat');
    }
    const firstMessage = conv.messages?.[0];
    return firstMessage?.content?.substring(0, 30) || t('recentChats.newChat');
  };

  // Get movie poster URL - now from serializer
  const getMoviePoster = (conv) => {
    return conv.movie_poster || null;
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Sidebar - Recent Conversations */}
      <div
        className={cn(
          "w-full md:w-[400px] border-r border-border/50 flex flex-col bg-card/50",
          selectedConversation && "hidden md:flex"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex-shrink-0 p-6 border-b border-border/50">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">{t('recentChats.title')}</h2>
            <Button
              variant="link"
              size="sm"
              onClick={handleClearAll}
              disabled={!conversations?.data?.length}
              className="text-blue-500 hover:text-blue-600 text-sm font-normal"
            >
              {t('recentChats.clearAll')}
            </Button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">{t('recentChats.loading')}</p>
              </div>
            </div>
          ) : conversations?.data?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('recentChats.noConversationsYet')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('recentChats.startChattingHistory')}
              </p>
              <Button onClick={() => navigate('/chat')}>
                {t('recentChats.startNewChat')}
              </Button>
            </div>
          ) : (
            <div className="h-full">
              {conversations?.data?.map((conv) => {
                const poster = getMoviePoster(conv);
                const unreadCount = conv.unread_count || 0;

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleConversationClick(conv.id)}
                    className={cn(
                      "p-4 cursor-pointer hover:bg-accent/50 transition-all border-b border-border/30",
                      selectedConversation === String(conv.id) && "bg-accent/70"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Movie Poster or Icon */}
                      <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-card border border-border/50">
                        {poster ? (
                          <img
                            src={poster}
                            alt={getConversationTitle(conv)}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                                  ${conv.conversation_type === 'movie'
                                    ? '<svg class="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><path d="M7 3v18M3 8h4M3 16h4M17 3v18M17 8h4M17 16h4"></path></svg>'
                                    : '<svg class="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>'
                                  }
                                </div>
                              `;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                            {conv.conversation_type === 'movie' ? (
                              <Film className="w-6 h-6 text-primary" />
                            ) : (
                              <MessagesSquare className="w-6 h-6 text-primary" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Conversation Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-base truncate">
                            {getConversationTitle(conv)}
                          </h3>
                          {unreadCount > 0 && (
                            <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground/80 truncate mb-1.5">
                          {getPreviewText(conv)}
                        </p>
                        <div className="text-xs text-muted-foreground/60">
                          {formatDate(conv.updated_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Conversation View */}
      <div className="flex-1 flex flex-col bg-background">
        {selectedConversation ? (
          <>
            {/* Mobile Back Button */}
            <div className="md:hidden flex items-center gap-2 p-4 border-b">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedConversation(null);
                  navigate('/recent');
                }}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t('common.back')}
              </Button>
            </div>

            {/* Conversation Details */}
            {isLoadingDetails ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">{t('recentChats.loadingConversation')}</p>
                </div>
              </div>
            ) : conversationDetails?.data ? (
              <ConversationView conversation={conversationDetails.data} />
            ) : null}
          </>
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center h-full p-8 text-center">
            {/* Illustration */}
            <div className="w-32 h-32 mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-2xl blur-xl"></div>
              <div className="relative w-full h-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl flex items-center justify-center border border-border/30">
                <MessagesSquare className="w-16 h-16 text-blue-500/60" />
              </div>
            </div>

            {/* Text */}
            <h2 className="text-2xl font-bold mb-2">{t('recentChats.selectConversation')}</h2>
            <p className="text-muted-foreground/70 max-w-sm">
              {t('recentChats.chooseChat')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentChats;
