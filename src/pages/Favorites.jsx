import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moviesAPI } from '../api';
import { Link } from 'react-router-dom';
import { Heart, Loader2, Star, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import useAuthStore from '../store/authStore';

const Favorites = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  const { data: favoritesData, isLoading, isError } = useQuery({
    queryKey: ['favorites'],
    queryFn: moviesAPI.getFavorites,
    enabled: isAuthenticated
  });

  const removeMutation = useMutation({
    mutationFn: moviesAPI.removeFromFavorites,
    onSuccess: () => {
      queryClient.invalidateQueries(['favorites']);
    }
  });

  const movies = Array.isArray(favoritesData?.data?.results)
    ? favoritesData.data.results
    : Array.isArray(favoritesData?.data)
    ? favoritesData.data
    : [];

  const handleRemoveFavorite = (movieId, movieTitle, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Remove "${movieTitle}" from favorites?`)) {
      removeMutation.mutate(movieId);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Heart className="w-16 h-16 mx-auto text-muted-foreground" />
          <h2 className="text-2xl font-bold">Login Required</h2>
          <p className="text-muted-foreground">Please log in to view your favorite movies</p>
          <Button asChild>
            <Link to="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">Failed to load favorites</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
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
            <h1 className="text-4xl font-bold">My Favorites</h1>
          </div>
          <p className="text-muted-foreground">
            {isLoading ? 'Loading...' : `${movies.length} ${movies.length === 1 ? 'movie' : 'movies'} in your favorites`}
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
            <Heart className="w-20 h-20 mx-auto text-muted-foreground" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">No favorites yet</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Start adding movies to your favorites by clicking the heart icon on any movie
              </p>
            </div>
            <Button asChild>
              <Link to="/movies">Browse Movies</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {movies.map((movie) => (
              <div key={movie.id} className="group flex relative">
                <Link
                  to={`/movies/${movie.id}`}
                  className="flex-1"
                >
                  <Card className="overflow-hidden border-0 bg-card/50 hover:bg-card transition-all hover:scale-105 flex flex-col w-full h-full">
                    <div className="aspect-[2/3] relative overflow-hidden">
                      <img
                        src={movie.poster_url || 'https://via.placeholder.com/300x450?text=No+Poster'}
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

                      {/* Remove button - only shows on hover */}
                      <button
                        onClick={(e) => handleRemoveFavorite(movie.id, movie.title, e)}
                        disabled={removeMutation.isLoading}
                        className="absolute top-2 left-2 p-2 rounded-md bg-black/70 backdrop-blur-sm hover:bg-red-500/90 transition-all opacity-0 group-hover:opacity-100"
                        title="Remove from favorites"
                      >
                        {removeMutation.isLoading && removeMutation.variables === movie.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <CardContent className="p-3 min-h-[3rem] flex items-start">
                      <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors w-full">
                        {movie.title}
                      </h3>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
