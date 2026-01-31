import { useEffect, useRef, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Input } from './input';

const FilterModal = ({
  isOpen,
  onClose,
  genres = [],
  selectedGenres = [],
  onToggleGenre,
  yearFrom = '',
  yearTo = '',
  onYearFromChange,
  onYearToChange,
  onClearAll,
  onApply,
}) => {
  const modalRef = useRef(null);
  const [yearError, setYearError] = useState('');

  // Validate year range
  useEffect(() => {
    if (yearFrom && yearTo) {
      const from = parseInt(yearFrom);
      const to = parseInt(yearTo);
      if (from > to) {
        setYearError('Start year cannot be greater than end year');
      } else {
        setYearError('');
      }
    } else {
      setYearError('');
    }
  }, [yearFrom, yearTo]);

  // Handle year input with validation (max 4 digits, 1-9999)
  const handleYearChange = (value, onChange) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/\D/g, '');

    // Limit to 4 digits
    const limitedValue = numericValue.slice(0, 4);

    onChange(limitedValue);
  };

  // Check if year is valid (1-9999)
  const isYearValid = (year) => {
    if (!year) return true;
    const num = parseInt(year);
    return num >= 1 && num <= 9999;
  };

  const canApply = !yearError && isYearValid(yearFrom) && isYearValid(yearTo);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Close on click outside
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[85vh] bg-card rounded-xl shadow-2xl border border-border/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-accent transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)] custom-scrollbar">
          {/* Genres */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
              Genres
            </h3>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => {
                const isSelected = selectedGenres.includes(String(genre.tmdb_id));
                return (
                  <button
                    key={genre.tmdb_id}
                    onClick={() => onToggleGenre(String(genre.tmdb_id))}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all",
                      "border-2",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-transparent text-foreground border-border hover:border-primary/50"
                    )}
                  >
                    {genre.name}
                    <span className={cn(
                      "ml-1.5",
                      isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      ({genre.movie_count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-border" />

          {/* Release Year */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
              Release Year
            </h3>
            <div className="flex items-center gap-4">
              <Input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={yearFrom}
                onChange={(e) => handleYearChange(e.target.value, onYearFromChange)}
                placeholder="From"
                className={cn(
                  "h-12 w-32 text-center text-lg",
                  yearError && yearFrom && "border-destructive focus-visible:ring-destructive"
                )}
              />
              <span className="text-muted-foreground font-medium">to</span>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={yearTo}
                onChange={(e) => handleYearChange(e.target.value, onYearToChange)}
                placeholder="To"
                className={cn(
                  "h-12 w-32 text-center text-lg",
                  yearError && yearTo && "border-destructive focus-visible:ring-destructive"
                )}
              />
            </div>
            {yearError && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{yearError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 p-4 border-t border-border bg-card/50">
          <Button
            variant="ghost"
            onClick={onClearAll}
            className="text-muted-foreground"
          >
            Clear all filters
          </Button>
          <Button
            onClick={onApply}
            disabled={!canApply}
            className="px-8"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
