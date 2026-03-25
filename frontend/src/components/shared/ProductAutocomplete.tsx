import { useState, useEffect, useRef } from 'react';
import productService, { Product } from '../../services/product.service';
import { Search } from 'lucide-react';

interface ProductAutocompleteProps {
  onSelect: (product: Product) => void;
  placeholder?: string;
}

export function ProductAutocomplete({ onSelect, placeholder = 'Rechercher un produit...' }: ProductAutocompleteProps) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (search.trim()) {
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredProducts(filtered);
      setShowDropdown(true);
    } else {
      setFilteredProducts(products.slice(0, 10));
      setShowDropdown(false);
    }
  }, [search, products]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.list({ limit: 200 });
      setProducts(response.data || []);
    } catch (err) {
      console.error('Erreur chargement produits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (product: Product) => {
    onSelect(product);
    setSearch('');
    setShowDropdown(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          className="input pl-10"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => search.trim() && setShowDropdown(true)}
        />
      </div>

      {showDropdown && filteredProducts.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              onClick={() => handleSelect(product)}
            >
              <div className="font-medium text-sm">{product.name}</div>
              {product.description && (
                <div className="text-xs text-gray-500 truncate">{product.description}</div>
              )}
              <div className="text-xs text-gray-600 mt-1">
                Prix: {product.unitPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} 
                {product.taxRate ? ` • TVA: ${product.taxRate}%` : ''}
              </div>
            </button>
          ))}
        </div>
      )}

      {showDropdown && search.trim() && filteredProducts.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
          Aucun produit trouvé
        </div>
      )}
    </div>
  );
}
