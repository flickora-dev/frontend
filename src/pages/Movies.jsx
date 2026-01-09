import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { moviesAPI } from '../api';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Loader2, Star, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';

const Movies = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || '');
  const [selectedYear, setSelectedYear] = useState(searchParams.get('year') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('ordering') || '-year');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch genres
  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: moviesAPI.getGenres
  });

  // Fetch movies with filters
  const { data: moviesData, isLoading, isError } = useQuery({
    queryKey: ['movies', searchQuery, selectedGenre, selectedYear, sortBy],
    queryFn: () => {
      const params = {
        ordering: sortBy,
      };

      if (searchQuery) params.search = searchQuery;
      if (selectedGenre) params.genres__tmdb_id = selectedGenre;
      if (selectedYear) params.year = selectedYear;

      return moviesAPI.getMovies(params);
    }
  });

  // Update URL params when filters change
  useEffect(() => {
    const params = {};
    if (searchQuery) params.search = searchQuery;
    if (selectedGenre) params.genre = selectedGenre;
    if (selectedYear) params.year = selectedYear;
    if (sortBy !== '-year') params.ordering = sortBy;

    setSearchParams(params);
  }, [searchQuery, selectedGenre, selectedYear, sortBy, setSearchParams]);

  const genres = Array.isArray(genresData?.data?.results)
    ? genresData.data.results
    : Array.isArray(genresData?.data)
    ? genresData.data
    : [];

  const movies = Array.isArray(moviesData?.data?.results)
    ? moviesData.data.results
    : Array.isArray(moviesData?.data)
    ? moviesData.data
    : [];

  // Generate year options (current year down to 1900)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedGenre('');
    setSelectedYear('');
    setSortBy('-year');
    setSearchParams({});
  };

  const hasActiveFilters = searchQuery || selectedGenre || selectedYear || sortBy !== '-year';

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">Failed to load movies</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Discover Movies</h1>
            <p className="text-muted-foreground">Browse our collection of analyzed movies</p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search movies by title, director..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-12 text-base"
            />
          </div>

          {/* Filter Toggle Button */}
          <div className="flex items-center gap-4 flex-wrap">
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={handleClearFilters}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
                Clear All Filters
              </Button>
            )}

            <span className="text-sm text-muted-foreground ml-auto">
              {movies.length} {movies.length === 1 ? 'movie' : 'movies'} found
            </span>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-card rounded-lg border">
              {/* Genre Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Genre</label>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All Genres</option>
                  {genres.map((genre) => (
                    <option key={genre.tmdb_id} value={genre.tmdb_id}>
                      {genre.name} ({genre.movie_count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All Years</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="-year">Newest First</option>
                  <option value="year">Oldest First</option>
                  <option value="-imdb_rating">Highest Rated</option>
                  <option value="imdb_rating">Lowest Rated</option>
                  <option value="title">Title A-Z</option>
                  <option value="-title">Title Z-A</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Movies Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-xl text-muted-foreground">No movies found</p>
            {hasActiveFilters && (
              <Button onClick={handleClearFilters} variant="outline">
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
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
    </div>
  );
};

export default Movies;
