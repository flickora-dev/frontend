import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { moviesAPI } from '../api';
import { chatAPI } from '../api/chat';
import { Star, ArrowLeft, ChevronDown, Film, Heart, Share2, Send, Sparkles, Loader2, User } from 'lucide-react';
import { useState, useRef, useEffect  } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { cn } from '../lib/utils';

const MovieDetail = () => {
  const { id } = useParams();
  const [expandedSections, setExpandedSections] = useState({});
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessage, setTypingMessage] = useState('');
  const messagesContainerRef  = useRef(null);


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
  if (index < message.length) {
      setTypingMessage(prev => prev + message.charAt(index));
      setTimeout(() => typeMessage(message, index + 1), 20);
    } else {
      setIsTyping(false);
      setTypingMessage('');
    }
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

  const sendMessageMutation = useMutation({
    mutationFn: (message) => chatAPI.sendMessage(message, id),
    onSuccess: (response) => {
      setIsTyping(true);
      setTypingMessage('');
      const aiMessagecontent = response.data.message;
      const aiMessage = {
        role: 'assistant',
        content: response.data.message,
        sources: response.data.sources
      };
      typeMessage(aiMessagecontent);
      setMessages(prev => [...prev, aiMessage]);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
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
    "What are the main themes?",
    "Tell me about the characters",
    "What's the significance of the ending?"
  ];

  useEffect(() => {
    scrollToBottom();
  } , [messages, sendMessageMutation.isPending]);


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
        <h1 className="text-2xl font-bold">Movie not found</h1>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
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
            Back to Movies
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
                      src={movie.poster_url || 'https://via.placeholder.com/300x450?text=No+Poster'}
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
                            <span>Directed by {movie.director}</span>
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
                      <Button variant="default" className="gap-2">
                        <Heart className="w-4 h-4" />
                        Add to Favorites
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <Share2 className="w-4 h-4" />
                        Share
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
                  <CardTitle>Synopsis</CardTitle>
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
                      {showFullSynopsis ? 'Read Less' : 'Read More'}
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
                  <CardTitle>Cast</CardTitle>
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
                    AI-Generated Analysis
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
                          <span className="text-xs text-muted-foreground">{section.word_count} words</span>
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
                              <span className="text-sm font-medium">Key Topics:</span>
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
                  <CardTitle>Similar Movies</CardTitle>
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
                              src={similar.poster_url || 'https://via.placeholder.com/200x300?text=No+Poster'}
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
                    Chat with AI
                  </CardTitle>
                  <CardDescription>
                    Ask me anything about {movie.title}
                  </CardDescription>
                </CardHeader>

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
                        Ask me anything about this movie!
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

                  {sendMessageMutation.isPending && (
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
                      placeholder="Ask about this movie..."
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!chatMessage.trim() || sendMessageMutation.isPending}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Quick Questions - Below chat */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h4 className="text-sm font-medium">Quick Questions</h4>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;