import { useQuery } from '@tanstack/react-query';
import { moviesAPI } from '../api';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Loader2, Star, Flame } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { DEFAULT_POSTER } from '../constants/images';

const Trending = () => {
  const { t } = useTranslation();
  const { data: trendingData, isLoading, isError } = useQuery({
    queryKey: ['trending'],
    queryFn: moviesAPI.getTrending
  });

  const movies = Array.isArray(trendingData?.data?.results)
    ? trendingData.data.results
    : Array.isArray(trendingData?.data)
    ? trendingData.data
    : [];

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">{t('movies.failedToLoad')}</p>
          <Button onClick={() => window.location.reload()}>{t('common.retry')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold">{t('trending.title')}</h1>
          </div>
          <p className="text-muted-foreground">
            {isLoading ? t('common.loading') : t('trending.moviesThisWeek', { count: movies.length })}
          </p>
        </div>
      </div>

      {/* Movies Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20 space-y-6">
            <TrendingUp className="w-20 h-20 mx-auto text-muted-foreground" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{t('trending.noMovies')}</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {t('trending.noMoviesDesc')}
              </p>
            </div>
            <Button asChild>
              <Link to="/movies">{t('trending.browseAll')}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Featured Top 3 */}
            {movies.length >= 3 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
                  {t('trending.top3')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {movies.slice(0, 3).map((movie, index) => (
                    <Link
                      key={movie.id}
                      to={`/movies/${movie.id}`}
                      className="group relative"
                    >
                      <Card className="overflow-hidden border-2 border-primary/20 hover:border-primary/50 transition-all hover:scale-105 h-full">
                        {/* Ranking Badge */}
                        <div className="absolute top-4 left-4 z-10 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                          #{index + 1}
                        </div>

                        <div className="aspect-[2/3] relative overflow-hidden">
                          <img
                            src={movie.poster_url || DEFAULT_POSTER}
                            alt={movie.title}
                            className="object-cover w-full h-full"
                            loading="lazy"
                          />
                          {movie.imdb_rating && (
                            <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-xs font-medium">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span>{movie.imdb_rating}</span>
                            </div>
                          )}
                          {movie.year && (
                            <div className="absolute bottom-4 left-4 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-xs font-medium">
                              {movie.year}
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-bold text-base line-clamp-2 group-hover:text-primary transition-colors">
                            {movie.title}
                          </h3>
                          {movie.director && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Directed by {movie.director}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* All Trending Movies */}
            {movies.length > 3 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">{t('trending.allMovies')}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {movies.slice(3).map((movie, index) => (
                    <Link
                      key={movie.id}
                      to={`/movies/${movie.id}`}
                      className="group flex"
                    >
                      <Card className="overflow-hidden border-0 bg-card/50 hover:bg-card transition-all hover:scale-105 flex flex-col w-full h-full">
                        <div className="aspect-[2/3] relative overflow-hidden">
                          {/* Ranking Badge for 4-10 */}
                          {index < 7 && (
                            <div className="absolute top-2 left-2 z-10 w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                              #{index + 4}
                            </div>
                          )}

                          <img
                            src={movie.poster_url || DEFAULT_POSTER}
                            alt={movie.title}
                            className="object-cover w-full h-full"
                            loading="lazy"
                          />
                          {movie.imdb_rating && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-xs font-medium">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span>{movie.imdb_rating}</span>
                            </div>
                          )}
                          {movie.year && (
                            <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-xs font-medium">
                              {movie.year}
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
              </div>
            )}

            {/* Show all movies in regular grid if less than 3 */}
            {movies.length > 0 && movies.length < 3 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {movies.map((movie) => (
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
                          loading="lazy"
                        />
                        {movie.imdb_rating && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-xs font-medium">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span>{movie.imdb_rating}</span>
                          </div>
                        )}
                        {movie.year && (
                          <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-xs font-medium">
                            {movie.year}
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Trending;
