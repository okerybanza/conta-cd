/**
 * DOC-10 : Message d'erreur explicite avec solution
 * - Explique pourquoi
 * - Indique quoi faire à la place
 * - Jamais de refus sans explication
 */

import { AlertCircle, Info, ArrowRight } from 'lucide-react';

interface ErrorMessageProps {
  error: string | Error | { message: string; code?: string; solution?: string; details?: any };
  solution?: string; // DOC-10 : Ce qu'il faut faire à la place
  onSolutionClick?: () => void; // Action pour appliquer la solution
  className?: string;
  variant?: 'error' | 'warning' | 'info';
}

export function ErrorMessage({ 
  error, 
  solution, 
  onSolutionClick,
  className = '',
  variant = 'error'
}: ErrorMessageProps) {
  // Extraire le message d'erreur
  let errorMessage = '';
  let errorCode = '';
  let errorSolution = solution;

  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (error && typeof error === 'object') {
    errorMessage = error.message || 'Une erreur est survenue';
    errorCode = error.code || '';
    errorSolution = error.solution || errorSolution;
  }

  const variants = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-600',
      title: 'text-red-900',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-600',
      title: 'text-yellow-900',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-600',
      title: 'text-blue-900',
    },
  };

  const styles = variants[variant];

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className={`h-5 w-5 ${styles.icon} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 space-y-2">
          {/* Message d'erreur */}
          <div>
            <p className={`font-medium ${styles.title} mb-1`}>
              {variant === 'error' ? 'Erreur' : variant === 'warning' ? 'Avertissement' : 'Information'}
              {errorCode && <span className="text-xs ml-2 opacity-75">({errorCode})</span>}
            </p>
            <p className={styles.text}>{errorMessage}</p>
          </div>

          {/* DOC-10 : Solution proposée */}
          {errorSolution && (
            <div className={`${styles.bg} border ${styles.border} rounded p-3 mt-3`}>
              <div className="flex items-start gap-2">
                <Info className={`h-4 w-4 ${styles.icon} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${styles.title} mb-1`}>
                    Que faire à la place ?
                  </p>
                  <p className={`text-sm ${styles.text}`}>{errorSolution}</p>
                  {onSolutionClick && (
                    <button
                      onClick={onSolutionClick}
                      className={`mt-2 text-sm font-medium ${styles.text} hover:underline flex items-center gap-1`}
                    >
                      Appliquer la solution
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
