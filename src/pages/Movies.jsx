import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { moviesAPI } from '../api';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Search, Loader2, Star, X, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import MultiSelect from '../components/ui/MultiSelect';
import FilterModal from '../components/ui/FilterModal';
import { cn } from '../lib/utils';

const Movies = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();

  // State from URL params - now supporting multiple values
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedGenres, setSelectedGenres] = useState(
    searchParams.get('genres')?.split(',').filter(Boolean) || []
  );
  const [yearFrom, setYearFrom] = useState(searchParams.get('year_from') || '');
  const [yearTo, setYearTo] = useState(searchParams.get('year_to') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('ordering') || '-year');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);

  // Fetch genres
  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: moviesAPI.getGenres
  });

  // Fetch movies with filters and pagination
  const { data: moviesData, isLoading, isError } = useQuery({
    queryKey: ['movies', searchQuery, selectedGenres, yearFrom, yearTo, sortBy, currentPage],
    queryFn: () => {
      const params = {
        ordering: sortBy,
        page: currentPage,
      };

      if (searchQuery) params.search = searchQuery;
      if (selectedGenres.length > 0) params.genres__tmdb_id__in = selectedGenres.join(',');
      if (yearFrom) params.year_from = yearFrom;
      if (yearTo) params.year_to = yearTo;

      return moviesAPI.getMovies(params);
    }
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGenres, yearFrom, yearTo, sortBy]);

  // Update URL params when filters change
  useEffect(() => {
    const params = {};
    if (searchQuery) params.search = searchQuery;
    if (selectedGenres.length > 0) params.genres = selectedGenres.join(',');
    if (yearFrom) params.year_from = yearFrom;
    if (yearTo) params.year_to = yearTo;
    if (sortBy !== '-year') params.ordering = sortBy;
    if (currentPage > 1) params.page = currentPage;

    setSearchParams(params);
  }, [searchQuery, selectedGenres, yearFrom, yearTo, sortBy, currentPage, setSearchParams]);

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

  // Pagination info from API response
  const totalCount = moviesData?.data?.count || movies.length;
  const pageSize = 20;
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = !!moviesData?.data?.next;
  const hasPrevPage = !!moviesData?.data?.previous;

  // Current year for validation
  const currentYear = new Date().getFullYear();

  // Prepare options for MultiSelect components
  const genreOptions = useMemo(() =>
    genres.map((genre) => ({
      value: String(genre.tmdb_id),
      label: genre.name,
      count: genre.movie_count,
    })),
    [genres]
  );

  const sortOptions = [
    { value: '-year', label: t('movies.newestFirst') },
    { value: 'year', label: t('movies.oldestFirst') },
    { value: '-imdb_rating', label: t('movies.highestRated') },
    { value: 'imdb_rating', label: t('movies.lowestRated') },
    { value: 'title', label: t('movies.titleAZ') },
    { value: '-title', label: t('movies.titleZA') },
  ];

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedGenres([]);
    setYearFrom('');
    setYearTo('');
    setSortBy('-year');
    setCurrentPage(1);
    setSearchParams({});
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleGenre = (genreId) => {
    setSelectedGenres(prev =>
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };

  const removeGenre = (genreId) => {
    setSelectedGenres(prev => prev.filter(id => id !== genreId));
  };

  const clearYearRange = () => {
    setYearFrom('');
    setYearTo('');
  };

  const hasActiveFilters = searchQuery || selectedGenres.length > 0 || yearFrom || yearTo || sortBy !== '-year';

  // Get genre name by ID
  const getGenreName = (genreId) => {
    const genre = genres.find(g => String(g.tmdb_id) === genreId);
    return genre?.name || genreId;
  };

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">{t('movies.failedToLoad')}</p>
          <Button onClick={() => window.location.reload()}>{t('movies.retry')}</Button>
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
            <h1 className="text-4xl font-bold mb-2">{t('movies.discover')}</h1>
            <p className="text-muted-foreground">{t('movies.browseCollection')}</p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('movies.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-12 text-base"
            />
          </div>

          {/* Results count and filter toggle */}
          <div className="flex items-center gap-4 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setIsFilterModalOpen(true)}
              className="gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t('movies.filters')}
              {(selectedGenres.length > 0 || yearFrom || yearTo) && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                  {selectedGenres.length + (yearFrom || yearTo ? 1 : 0)}
                </span>
              )}
            </Button>

            <span className="text-sm text-muted-foreground">
              {t('movies.moviesFound', { count: totalCount })}
            </span>

            {/* Sort By - always visible */}
            <div className="ml-auto">
              <MultiSelect
                options={sortOptions}
                value={sortBy}
                onChange={setSortBy}
                placeholder={t('movies.sortBy')}
                multiple={false}
              />
            </div>
          </div>

          {/* Active Filters Tags */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              {selectedGenres.map(genreId => (
                <span
                  key={genreId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium"
                >
                  {getGenreName(genreId)}
                  <button
                    onClick={() => removeGenre(genreId)}
                    className="hover:bg-primary-foreground/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}

              {(yearFrom || yearTo) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {yearFrom && yearTo
                    ? `${yearFrom} - ${yearTo}`
                    : yearFrom
                    ? `${t('common.from')} ${yearFrom}`
                    : `${t('common.to')} ${yearTo}`}
                  <button
                    onClick={clearYearRange}
                    className="hover:bg-primary-foreground/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-muted-foreground hover:text-foreground h-8"
              >
                {t('movies.clearAll')}
              </Button>
            </div>
          )}

          {/* Filter Modal */}
          <FilterModal
            isOpen={isFilterModalOpen}
            onClose={() => setIsFilterModalOpen(false)}
            genres={genres}
            selectedGenres={selectedGenres}
            onToggleGenre={toggleGenre}
            yearFrom={yearFrom}
            yearTo={yearTo}
            onYearFromChange={setYearFrom}
            onYearToChange={setYearTo}
            onClearAll={handleClearFilters}
            onApply={() => setIsFilterModalOpen(false)}
          />
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
            <p className="text-xl text-muted-foreground">{t('movies.noMoviesFound')}</p>
            {hasActiveFilters && (
              <Button onClick={handleClearFilters} variant="outline">
                {t('movies.clearFilters')}
              </Button>
            )}
          </div>
        ) : (
          <>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!hasPrevPage}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t('common.previous')}
                </Button>

                <div className="flex items-center gap-1">
                  {/* First page */}
                  {currentPage > 3 && (
                    <>
                      <Button
                        variant={currentPage === 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        className="w-9 h-9 p-0"
                      >
                        1
                      </Button>
                      {currentPage > 4 && <span className="px-2 text-muted-foreground">...</span>}
                    </>
                  )}

                  {/* Pages around current */}
                  {Array.from({ length: 5 }, (_, i) => currentPage - 2 + i)
                    .filter(page => page >= 1 && page <= totalPages)
                    .map(page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="w-9 h-9 p-0"
                      >
                        {page}
                      </Button>
                    ))
                  }

                  {/* Last page */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && <span className="px-2 text-muted-foreground">...</span>}
                      <Button
                        variant={currentPage === totalPages ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                        className="w-9 h-9 p-0"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasNextPage}
                  className="gap-1"
                >
                  {t('common.next')}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Movies;
