import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, User, FileText, Package, CreditCard, Loader2 } from 'lucide-react';
import searchService, { SearchResult } from '../../services/search.service';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleSelectResult(results[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        const response = await searchService.search({ q: query, limit: 10 });
        setResults(response.data);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    // Scroll selected item into view
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleSelectResult = (result: SearchResult) => {
    navigate(result.url);
    onClose();
    setQuery('');
    setResults([]);
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'customer':
        return User;
      case 'invoice':
        return FileText;
      case 'product':
        return Package;
      case 'payment':
        return CreditCard;
      default:
        return Search;
    }
  };

  const getResultTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'customer':
        return 'Client';
      case 'invoice':
        return 'Facture';
      case 'product':
        return 'Article';
      case 'payment':
        return 'Paiement';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search Modal */}
      <div className="fixed inset-x-0 top-20 z-50 mx-auto max-w-2xl px-4">
        <div className="bg-white rounded-xl shadow-2xl border border-border overflow-hidden animate-fade-in">
          {/* Search Input */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={20} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher clients, factures, articles, paiements..."
                className="w-full pl-10 pr-10 py-3 bg-background-gray border-0 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    setResults([]);
                    inputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-background-gray transition-colors"
                >
                  <X size={16} className="text-text-muted" />
                </button>
              )}
            </div>
            <div className="mt-2 flex items-center space-x-4 text-xs text-text-muted">
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-background-gray rounded text-xs font-mono">
                  ↑↓
                </kbd>
                <span>Naviguer</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-background-gray rounded text-xs font-mono">
                  ↵
                </kbd>
                <span>Sélectionner</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-background-gray rounded text-xs font-mono">
                  Esc
                </kbd>
                <span>Fermer</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto" ref={resultsRef}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={24} />
                <span className="ml-3 text-text-secondary">Recherche en cours...</span>
              </div>
            ) : query.length < 2 ? (
              <div className="py-12 text-center">
                <Search className="mx-auto text-text-muted mb-4" size={48} />
                <p className="text-text-secondary">
                  Tapez au moins 2 caractères pour rechercher
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="py-12 text-center">
                <Search className="mx-auto text-text-muted mb-4" size={48} />
                <p className="text-text-secondary">Aucun résultat trouvé</p>
                <p className="text-sm text-text-muted mt-2">
                  Essayez avec d'autres mots-clés
                </p>
              </div>
            ) : (
              <div className="py-2">
                {results.map((result, index) => {
                  const Icon = getResultIcon(result.type);
                  const isSelected = index === selectedIndex;

                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelectResult(result)}
                      className={`
                        w-full px-4 py-3 flex items-start space-x-3
                        transition-colors text-left
                        ${isSelected
                          ? 'bg-primary/10 border-l-2 border-primary'
                          : 'hover:bg-background-gray'
                        }
                      `}
                    >
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                        ${isSelected
                          ? 'bg-primary/20 text-primary'
                          : 'bg-background-gray text-text-muted'
                        }
                      `}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className={`font-semibold text-sm ${isSelected ? 'text-primary' : 'text-text-primary'}`}>
                            {result.title}
                          </p>
                          <span className="px-2 py-0.5 bg-background-gray rounded text-xs text-text-secondary">
                            {getResultTypeLabel(result.type)}
                          </span>
                        </div>
                        {result.subtitle && (
                          <p className="text-sm text-text-secondary truncate">
                            {result.subtitle}
                          </p>
                        )}
                        {result.description && (
                          <p className="text-xs text-text-muted mt-1">
                            {result.description}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {results.length > 0 && (
            <div className="px-4 py-2 border-t border-border bg-background-gray/50">
              <p className="text-xs text-text-muted text-center">
                {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default GlobalSearch;

