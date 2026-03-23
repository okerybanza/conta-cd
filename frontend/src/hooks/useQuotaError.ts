import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface QuotaError {
  metric: string;
  limit: number;
  currentUsage: number;
  message?: string;
}

export function useQuotaError() {
  const navigate = useNavigate();
  const [quotaError, setQuotaError] = useState<QuotaError | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleError = useCallback((error: any): boolean => {
    // Vérifier si c'est une erreur de quota
    if (
      error?.response?.status === 403 &&
      error?.response?.data?.code === 'QUOTA_EXCEEDED'
    ) {
      const errorData = error.response.data;
      setQuotaError({
        metric: errorData.metric || 'unknown',
        limit: errorData.limit || 0,
        currentUsage: errorData.currentUsage || 0,
        message: errorData.message,
      });
      setShowModal(true);
      return true; // Erreur gérée
    }
    return false; // Erreur non gérée
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setQuotaError(null);
  }, []);

  const goToUpgrade = useCallback(() => {
    navigate('/settings/subscription/upgrade');
    closeModal();
  }, [navigate, closeModal]);

  return {
    quotaError,
    showModal,
    handleError,
    closeModal,
    goToUpgrade,
  };
}
