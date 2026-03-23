import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

interface UpgradeCardProps {
  title: string;
  message: string;
  feature: string;
}

export function UpgradeCard({ title, message, feature }: UpgradeCardProps) {
  const navigate = useNavigate();

  return (
    <div className="card border-dashed border-2 border-gray-300 bg-gray-50/50">
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-6">
        <Lock size={32} className="text-gray-400 mb-3" />
        <h3 className="font-semibold text-text-primary mb-2">{title}</h3>
        <p className="text-sm text-text-secondary mb-4">{message}</p>
        <button
          onClick={() => navigate('/settings/subscription/upgrade')}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          Débloquer cette fonctionnalité
        </button>
      </div>
    </div>
  );
}

