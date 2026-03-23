import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { SubscriptionRequiredModal } from '../components/subscription/SubscriptionRequiredModal';

interface SubscriptionRequiredContextType {
  showModal: (message?: string) => void;
  hideModal: () => void;
}

const SubscriptionRequiredContext = createContext<SubscriptionRequiredContextType | undefined>(
  undefined
);

export function SubscriptionRequiredProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    // Écouter les événements personnalisés déclenchés par l'intercepteur API
    const handleSubscriptionRequired = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      showModal(customEvent.detail?.message);
    };

    window.addEventListener('subscription-required', handleSubscriptionRequired);

    return () => {
      window.removeEventListener('subscription-required', handleSubscriptionRequired);
    };
  }, []);

  const showModal = (customMessage?: string) => {
    setMessage(customMessage);
    setIsOpen(true);
  };

  const hideModal = () => {
    setIsOpen(false);
    setMessage(undefined);
  };

  return (
    <SubscriptionRequiredContext.Provider value={{ showModal, hideModal }}>
      {children}
      <SubscriptionRequiredModal isOpen={isOpen} onClose={hideModal} message={message} />
    </SubscriptionRequiredContext.Provider>
  );
}

export function useSubscriptionRequired() {
  const context = useContext(SubscriptionRequiredContext);
  if (!context) {
    throw new Error('useSubscriptionRequired must be used within SubscriptionRequiredProvider');
  }
  return context;
}
