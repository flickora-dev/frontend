import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

const MultiSelect = ({
  options = [],
  value = [],
  onChange,
  placeholder = 'Select...',
  className,
  renderOption,
  multiple = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState('down');
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine dropdown direction based on available space
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 280; // approximate max height

      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setOpenDirection('up');
      } else {
        setOpenDirection('down');
      }
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (optionValue) => {
    if (multiple) {
      const newValue = value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue];
      onChange(newValue);
    } else {
      onChange(optionValue === value ? '' : optionValue);
      setIsOpen(false);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(multiple ? [] : '');
  };

  const selectedOptions = multiple
    ? options.filter((opt) => value.includes(opt.value))
    : options.find((opt) => opt.value === value);

  const hasSelection = multiple ? value.length > 0 : !!value;

  const getDisplayText = () => {
    if (!hasSelection) return placeholder;
    if (multiple) {
      if (value.length === 1) {
        return selectedOptions[0]?.label || placeholder;
      }
      return `${value.length} selected`;
    }
    return selectedOptions?.label || placeholder;
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'w-full h-10 px-3 flex items-center justify-between gap-2',
          'rounded-md border border-border/50 bg-card text-sm',
          'cursor-pointer transition-colors',
          'hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
          isOpen && 'border-primary ring-2 ring-primary/30'
        )}
      >
        <span className={cn('truncate', !hasSelection && 'text-muted-foreground')}>
          {getDisplayText()}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {hasSelection && (
            <span
              onClick={handleClear}
              className="p-0.5 hover:bg-muted rounded transition-colors"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </span>
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 text-muted-foreground transition-transform',
              isOpen && 'transform rotate-180'
            )}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            'absolute left-0 right-0 z-50',
            'bg-card border border-border/50 rounded-md shadow-lg',
            'max-h-[280px] overflow-y-auto custom-scrollbar',
            openDirection === 'down' ? 'top-full mt-1' : 'bottom-full mb-1'
          )}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">No options</div>
          ) : (
            options.map((option) => {
              const isSelected = multiple
                ? value.includes(option.value)
                : value === option.value;

              return (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'px-3 py-2 flex items-center gap-2 cursor-pointer transition-colors',
                    'hover:bg-primary/10',
                    isSelected && 'bg-primary/20'
                  )}
                >
                  {multiple && (
                    <div
                      className={cn(
                        'w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center',
                        isSelected
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground/50'
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                  )}
                  <span className="text-sm truncate flex-1">
                    {renderOption ? renderOption(option) : option.label}
                  </span>
                  {!multiple && isSelected && (
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
