import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { moviesAPI } from '../api';
import { chatAPI } from '../api/chat';
import { Star, ArrowLeft, ChevronDown, Heart, Share2, Send, Sparkles, Loader2, User, LogIn, StopCircle } from 'lucide-react';
import { useState, useRef, useEffect  } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { cn } from '../lib/utils';
import useAuthStore from '../store/authStore';
import { DEFAULT_POSTER } from '../constants/images';

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const [expandedSections, setExpandedSections] = useState({});
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessage, setTypingMessage] = useState('');
  const [isResponseStopped, setIsResponseStopped] = useState(false);
  const conversationIdRef = useRef(null);
  const messagesContainerRef  = useRef(null);
  const abortControllerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isMutatingRef = useRef(false);


  const scrollToBottom = () => {
  if (messagesContainerRef.current) {
    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  }
};
  const { data: movieData, isLoading: movieLoading } = useQuery({
    queryKey: ['movie', id],
    queryFn: () => moviesAPI.getMovie(id)
  });

  const { data: sectionsData } = useQuery({
    queryKey: ['movie-sections', id],
    queryFn: () => moviesAPI.getMovieSections(id),
    enabled: !!id
  });
  const typeMessage = (message, index = 0) => {
    if (isResponseStopped) {
      setIsTyping(false);
      setTypingMessage('');
      return;
    }
    if (index < message.length) {
      setTypingMessage(prev => prev + message.charAt(index));
      typingTimeoutRef.current = setTimeout(() => typeMessage(message, index + 1), 20);
    } else {
      setIsTyping(false);
      setTypingMessage('');
    }
  };

  const handleStopResponse = () => {
    setIsResponseStopped(true);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    setTypingMessage('');
  };  

  const { data: castData } = useQuery({
    queryKey: ['movie-cast', id],
    queryFn: () => moviesAPI.getMovieCast(id),
    enabled: !!id
  });

  const { data: similarData } = useQuery({
    queryKey: ['movie-similar', id],
    queryFn: () => moviesAPI.getSimilarMovies(id),
    enabled: !!id
  });

  // Check if movie is favorited
  const { data: favoritedData } = useQuery({
    queryKey: ['is-favorited', id],
    queryFn: () => moviesAPI.isFavorited(id),
    enabled: !!id && isAuthenticated
  });

  const isFavorited = favoritedData?.data?.is_favorited || false;

  // Add to favorites mutation
  const addFavoriteMutation = useMutation({
    mutationFn: () => moviesAPI.addToFavorites(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['is-favorited', id]);
      queryClient.invalidateQueries(['favorites']);
    }
  });

  // Remove from favorites mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: () => moviesAPI.removeFromFavorites(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['is-favorited', id]);
      queryClient.invalidateQueries(['favorites']);
    }
  });

  const handleFavoriteToggle = () => {
    if (!isAuthenticated) {
      alert(t('movieDetail.pleaseLoginFavorites'));
      return;
    }

    if (isFavorited) {
      removeFavoriteMutation.mutate();
    } else {
      addFavoriteMutation.mutate();
    }
  };

  const sendMessageMutation = useMutation({
    mutationFn: (message) => {
      // Prevent double calls (React StrictMode)
      if (isMutatingRef.current) {
        return Promise.reject(new Error('Already mutating'));
      }
      isMutatingRef.current = true;
      abortControllerRef.current = new AbortController();
      setIsResponseStopped(false);
      return chatAPI.sendMessage(message, id, conversationIdRef.current, abortControllerRef.current.signal);
    },
    onSuccess: (response) => {
      isMutatingRef.current = false;
      if (isResponseStopped) return;

      // Save conversation_id for subsequent messages
      if (response.data.conversation_id) {
        conversationIdRef.current = response.data.conversation_id;
      }

      setIsTyping(true);
      setTypingMessage('');
      const aiMessage = {
        role: 'assistant',
        content: response.data.message,
        sources: response.data.sources
      };
      typeMessage(response.data.message);
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
        const stoppedMessage = {
          role: 'assistant',
          content: t('chat.responseStopped'),
          isStopped: true
        };
        setMessages(prev => [...prev, stoppedMessage]);
        return;
      }
      const errorMessage = {
        role: 'assistant',
        content: t('chat.errorMessage'),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const movie = movieData?.data;
  const sections = sectionsData?.data || [];
  const cast = castData?.data?.cast || [];
  const similarMovies = similarData?.data?.similar || [];

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatMessage.trim() && !sendMessageMutation.isPending) {
      const userMessage = {
        role: 'user',
        content: chatMessage.trim()
      };
      setMessages(prev => [...prev, userMessage]);
      sendMessageMutation.mutate(chatMessage.trim());
      setChatMessage('');
    }
  };

  const handleQuickQuestion = (question) => {
  if (!sendMessageMutation.isPending) {
    const userMessage = {
      role: 'user',
      content: question
    };
    setMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate(question);
  }
};

  const quickQuestions = [
    t('movieDetail.whatAreMainThemes'),
    t('movieDetail.tellAboutCharacters'),
    t('movieDetail.significanceOfEnding')
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages, sendMessageMutation.isPending]);

  // Reset conversation when movie changes
  useEffect(() => {
    setMessages([]);
    conversationIdRef.current = null;
  }, [id]);

  if (movieLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">{t('movieDetail.movieNotFound')}</h1>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('movieDetail.backToHome')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Back Button */}
        <Button variant="ghost" asChild className="gap-2">
          <Link to="/movies">
            <ArrowLeft className="w-4 h-4" />
            {t('movieDetail.backToMovies')}
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Movie Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Poster */}
                  <div className="flex-shrink-0">
                    <img
                      src={movie.poster_url || DEFAULT_POSTER}
                      alt={movie.title}
                      className="w-full md:w-48 rounded-lg object-cover shadow-lg"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold mb-2">{movie.title}</h1>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>{movie.year}</span>
                        {movie.runtime && (
                          <>
                            <span>•</span>
                            <span>{movie.runtime} min</span>
                          </>
                        )}
                        {movie.director && (
                          <>
                            <span>•</span>
                            <span>{t('movieDetail.directedBy')} {movie.director}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {movie.imdb_rating && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "w-5 h-5",
                                i < Math.floor(movie.imdb_rating / 2)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted"
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-lg font-semibold">{movie.imdb_rating}/10</span>
                      </div>
                    )}

                    {movie.genres && movie.genres.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {movie.genres.map((genre) => (
                          <span
                            key={genre.id}
                            className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                          >
                            {genre.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        variant={isFavorited ? "default" : "outline"}
                        className="gap-2"
                        onClick={handleFavoriteToggle}
                        disabled={addFavoriteMutation.isLoading || removeFavoriteMutation.isLoading}
                      >
                        {addFavoriteMutation.isLoading || removeFavoriteMutation.isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Heart className={cn("w-4 h-4", isFavorited && "fill-current")} />
                        )}
                        {isFavorited ? t('movieDetail.removeFromFavorites') : t('movieDetail.addToFavorites')}
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <Share2 className="w-4 h-4" />
                        {t('movieDetail.share')}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Synopsis */}
            {movie.plot_summary && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('movieDetail.synopsis')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={cn(
                    "text-muted-foreground leading-relaxed",
                    !showFullSynopsis && movie.plot_summary.length > 300 && "line-clamp-4"
                  )}>
                    {movie.plot_summary}
                  </p>
                  {movie.plot_summary.length > 300 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFullSynopsis(!showFullSynopsis)}
                      className="mt-2 gap-2"
                    >
                      {showFullSynopsis ? t('movieDetail.readLess') : t('movieDetail.readMore')}
                      <ChevronDown className={cn("w-4 h-4 transition-transform", showFullSynopsis && "rotate-180")} />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Cast */}
            {cast.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('movieDetail.cast')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {cast.map((actor, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {actor.profile_path ? (
                            <img
                              src={actor.profile_path}
                              alt={actor.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-sm truncate">{actor.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">{actor.character}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Analysis Sections */}
            {sections.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    {t('movieDetail.aiGeneratedAnalysis')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sections.map((section) => (
                    <Card key={section.id} className="border-border">
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full p-4 flex items-center justify-between hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-left">{section.section_type_display}</h3>
                          <span className="text-xs text-muted-foreground">{section.word_count} {t('movieDetail.words')}</span>
                        </div>
                        <ChevronDown
                          className={cn(
                            "w-5 h-5 transition-transform",
                            expandedSections[section.id] && "rotate-180"
                          )}
                        />
                      </button>
                      {expandedSections[section.id] && (
                        <div className="px-4 pb-4 space-y-3">
                          <Separator />
                          <p className="text-muted-foreground leading-relaxed">{section.content}</p>
                          {section.key_topics && section.key_topics.length > 0 && (
                            <div className="space-y-2 pt-2">
                              <span className="text-sm font-medium">{t('movieDetail.keyTopics')}:</span>
                              <div className="flex flex-wrap gap-2">
                                {section.key_topics.map((topic, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs"
                                  >
                                    {topic}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Similar Movies */}
            {similarMovies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('movieDetail.similarMovies')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {similarMovies.map((similar) => (
                      <Link
                        key={similar.id}
                        to={`/movies/${similar.id}`}
                        className="group"
                      >
                        <Card className="overflow-hidden border-0 bg-card/50 hover:bg-card transition-all hover:scale-105">
                          <div className="aspect-[2/3] relative overflow-hidden">
                            <img
                              src={similar.poster_url || DEFAULT_POSTER}
                              alt={similar.title}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <CardContent className="p-2">
                            <h3 className="font-medium text-xs line-clamp-2 group-hover:text-primary transition-colors">
                              {similar.title}
                            </h3>
                            <p className="text-xs text-muted-foreground">{similar.year}</p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Chat Widget */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-6 space-y-4">
              <Card className="flex flex-col h-[calc(100vh-8rem)]">
                <CardHeader className="flex-shrink-0 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    {t('movieDetail.chatWithAI')}
                  </CardTitle>
                  <CardDescription>
                    {t('movieDetail.askAboutMovie', { title: movie.title })}
                  </CardDescription>
                </CardHeader>

                {/* Login required check for chat */}
                {!isAuthenticated ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{t('chat.loginRequired')}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('chat.pleaseLoginToChat')}
                    </p>
                    <Button onClick={() => navigate('/login')} className="gap-2">
                      <LogIn className="w-4 h-4" />
                      {t('common.goToLogin')}
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Messages */}
                    <div
                      ref={messagesContainerRef}
                      className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40"
                    >
                      {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-primary" />
                          </div>
                          <p className="text-sm text-muted-foreground px-4">
                            {t('movieDetail.askAnythingAboutMovie')}
                          </p>
                        </div>
                      )}

                      {messages.map((msg, index) => (
                        <div
                          key={index}
                          className={cn(
                            "flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
                            msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                          )}
                        >
                          {msg.role === 'assistant' && (
                            <div className="w-7 h-7 rounded-md bg-card border flex items-center justify-center flex-shrink-0">
                              <Sparkles className="w-3.5 h-3.5 text-primary" />
                            </div>
                          )}
                          <div
                            className={cn(
                              "flex flex-col gap-1",
                              msg.role === 'user' ? 'items-end' : 'items-start',
                              "max-w-[90%]"
                            )}
                          >
                            <Card
                              className={cn(
                                "p-3",
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
                                  {msg.role === 'assistant' && isTyping && index === messages.length - 1
                                    ? typingMessage
                                    : msg.content}
                                </ReactMarkdown>
                              </div>
                            </Card>
                          </div>
                        </div>
                      ))}

                      {(sendMessageMutation.isPending || isTyping) && (
                        <div className="flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <div className="w-7 h-7 rounded-md bg-card border flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <Card className="p-3 bg-card border">
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
                    <CardContent className="flex-shrink-0 border-t p-4">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                          type="text"
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          placeholder={t('movieDetail.askAboutMoviePlaceholder')}
                          disabled={sendMessageMutation.isPending || isTyping}
                          className="flex-1"
                        />
                        {(sendMessageMutation.isPending || isTyping) ? (
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            onClick={handleStopResponse}
                            title={t('chat.stopResponse')}
                          >
                            <StopCircle className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            size="icon"
                            disabled={!chatMessage.trim()}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                      </form>
                    </CardContent>
                  </>
                )}
              </Card>

              {/* Quick Questions - Below chat (only for authenticated users) */}
              {isAuthenticated && (
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h4 className="text-sm font-medium">{t('movieDetail.quickQuestions')}</h4>
                    <div className="space-y-2">
                      {quickQuestions.map((question, index) => (
                        <Button
                          key={index}
                          variant="secondary"
                          size="sm"
                          className="w-full text-xs justify-start h-auto py-2"
                          onClick={() => handleQuickQuestion(question)}
                          disabled={sendMessageMutation.isPending}
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;