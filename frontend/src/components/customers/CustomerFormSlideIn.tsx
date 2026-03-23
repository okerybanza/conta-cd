import { SlideIn } from '../ui/SlideIn';
import { CustomerForm } from './CustomerForm';

interface CustomerFormSlideInProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  onSuccess?: () => void;
}

export function CustomerFormSlideIn({
  isOpen,
  onClose,
  customerId,
  onSuccess,
}: CustomerFormSlideInProps) {
  return (
    <SlideIn isOpen={isOpen} onClose={onClose} title={customerId ? 'Modifier le client' : 'Nouveau client'} size="xl">
      <div className="pb-10">
        <CustomerForm
          customerId={customerId}
          onSuccess={() => {
            if (onSuccess) onSuccess();
            onClose();
          }}
          onCancel={onClose}
        />
      </div>
    </SlideIn>
  );
}
