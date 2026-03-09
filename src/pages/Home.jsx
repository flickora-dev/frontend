import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { moviesAPI } from '../api';
import { Search, MessageCircle, Star, Loader2, Sparkles } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { DEFAULT_POSTER } from '../constants/images';

const Home = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ['trending'],
    queryFn: moviesAPI.getTrending
  });

  const { data: topMoviesData, isLoading: topLoading } = useQuery({
    queryKey: ['top-movies'],
    queryFn: () => moviesAPI.getMovies({ limit: 20, ordering: '-imdb_rating' })
  });

  // Ensure we always get an array
  const trendingMovies = Array.isArray(trendingData?.data?.results)
    ? trendingData.data.results
    : Array.isArray(trendingData?.data)
    ? trendingData.data
    : [];

  const topMovies = Array.isArray(topMoviesData?.data?.results)
    ? topMoviesData.data.results
    : Array.isArray(topMoviesData?.data)
    ? topMoviesData.data
    : [];

  const popularQuestions = [
    {
      question: "What are the best sci-fi movies of 2024?",
      category: "sci-fi"
    },
    {
      question: "Recommend movies similar to Christopher Nolan films",
      category: "recommendations"
    },
    {
      question: "What's trending in horror movies right now?",
      category: "trending"
    }
  ];

  const handleAskAI = (question) => {
    navigate('/chat', { state: { initialQuestion: question } });
  };

  if (trendingLoading || topLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-primary/10 to-background py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-4">
            <Sparkles className="w-4 h-4" />
            {t('home.aiPoweredDiscovery')}
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            {t('home.welcomeTo')} <span className="text-primary">flickora</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('home.discoverNextFavorite')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              onClick={() => navigate('/movies')}
              className="gap-2"
            >
              <Search className="w-5 h-5" />
              {t('home.searchMovies')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/chat')}
              className="gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              {t('home.startChatting')}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
        {/* Popular Questions */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold">{t('home.popularQuestions')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {popularQuestions.map((item, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg group flex flex-col h-full"
                onClick={() => handleAskAI(item.question)}
              >
                <CardHeader className="flex-1">
                  <CardDescription className="text-base group-hover:text-foreground transition-colors">
                    {item.question}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button variant="secondary" size="sm" className="w-full gap-2 bg-primary/10 hover:bg-primary/20 text-primary">
                    <MessageCircle className="w-4 h-4" />
                    {t('home.askAI')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* Trending Movies */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">{t('home.trendingThisWeek')}</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {trendingMovies.slice(0, 10).map((movie) => (
              <Link
                key={movie.id}
                to={`/movies/${movie.id}`}
                className="group flex"
              >
                <Card className="overflow-hidden border-0 bg-card/50 hover:bg-card transition-all hover:scale-105 flex flex-col w-full h-full">
                  <div className="aspect-[2/3] relative overflow-hidden">
                    <img
                      src={movie.poster_url || DEFAULT_POSTER}
                      alt={movie.title}
                      className="object-cover w-full h-full"
                    />
                    {movie.imdb_rating && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-xs font-medium">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{movie.imdb_rating}</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3 min-h-[3rem] flex items-start">
                    <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors w-full">
                      {movie.title}
                    </h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <Separator />

        {/* Top Rated Movies */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">{t('home.topRated')}</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {topMovies.slice(0, 10).map((movie) => (
              <Link
                key={movie.id}
                to={`/movies/${movie.id}`}
                className="group flex"
              >
                <Card className="overflow-hidden border-0 bg-card/50 hover:bg-card transition-all hover:scale-105 flex flex-col w-full h-full">
                  <div className="aspect-[2/3] relative overflow-hidden">
                    <img
                      src={movie.poster_url || DEFAULT_POSTER}
                      alt={movie.title}
                      className="object-cover w-full h-full"
                    />
                    {movie.imdb_rating && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-xs font-medium">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{movie.imdb_rating}</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3 min-h-[3rem] flex items-start">
                    <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors w-full">
                      {movie.title}
                    </h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;