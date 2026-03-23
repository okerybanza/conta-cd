import { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

export interface Action {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface ActionsMenuProps {
  actions: Action[];
  className?: string;
}

export function ActionsMenu({ actions, className = '' }: ActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className={`relative inline-block ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => { action.onClick(); setIsOpen(false); }}
              disabled={action.disabled}
              className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors
                ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
                ${action.variant === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'}
              `}
            >
              {action.icon && <span className="flex-shrink-0">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
