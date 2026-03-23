import { Palette } from 'lucide-react';
import { useThemeStore, ThemeAppearance } from '../../store/theme.store';

export function ThemeSelector() {
  const { appearance, setAppearance } = useThemeStore();

  const themes: { value: ThemeAppearance; label: string; description: string }[] = [
    {
      value: 'modern',
      label: 'Moderne',
      description: 'Design moderne et épuré',
    },
    {
      value: 'classic',
      label: 'Classique',
      description: 'Design classique et professionnel',
    },
  ];

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Changer l'apparence"
      >
        <Palette size={18} className="text-gray-600" />
        <span className="text-sm text-gray-700 hidden md:inline">Apparence</span>
      </button>
      
      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="p-2">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase mb-2">
            Choisir l'apparence
          </div>
          {themes.map((theme) => (
            <button
              key={theme.value}
              onClick={() => setAppearance(theme.value)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors mb-1 ${
                appearance === theme.value
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="font-medium">{theme.label}</div>
              <div className="text-xs text-gray-500">{theme.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
