/**
 * DOC-10 : Vue en lecture seule
 * 
 * Principe : Séparation stricte Lecture / Action
 * - Aucune action critique depuis un écran "lecture"
 * - Les boutons d'action sont rares, visibles, explicites
 * - Aucune action critique en un clic
 */

import { Eye, AlertCircle } from 'lucide-react';

interface ReadOnlyViewProps {
  children: React.ReactNode;
  title?: string;
  showWarning?: boolean;
  warningMessage?: string;
  className?: string;
}

export function ReadOnlyView({
  children,
  title,
  showWarning = true,
  warningMessage = 'Ceci est un écran de consultation. Aucune modification n\'est possible depuis cette vue.',
  className = '',
}: ReadOnlyViewProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
            Lecture seule
          </span>
        </div>
      )}

      {showWarning && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">{warningMessage}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        {children}
      </div>
    </div>
  );
}
