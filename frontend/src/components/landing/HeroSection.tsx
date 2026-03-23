import { ReactNode } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';

interface HeroSectionProps {
  title: string | ReactNode;
  subtitle?: string;
  description?: string;
  primaryButton?: {
    text: string;
    onClick: () => void;
  };
  secondaryButton?: {
    text: string;
    onClick: () => void;
  };
  imageUrl?: string;
  imageAlt?: string;
  badges?: string[];
  className?: string;
}

export default function HeroSection({
  title,
  subtitle,
  description,
  primaryButton,
  secondaryButton,
  imageUrl,
  imageAlt = 'Hero image',
  badges,
  className = '',
}: HeroSectionProps) {
  return (
    <section className={`pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-white to-accent/5 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Image optionnelle en haut */}
        {imageUrl && (
          <div className="mb-12 max-w-5xl mx-auto">
            <img 
              src={imageUrl} 
              alt={imageAlt} 
              className="w-full h-auto rounded-lg shadow-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        
        <div className="text-center">
          {subtitle && (
            <p className="text-lg text-primary font-semibold mb-4">{subtitle}</p>
          )}
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            {title}
          </h1>
          {description && (
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {description}
            </p>
          )}
          
          {(primaryButton || secondaryButton) && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              {primaryButton && (
                <button
                  onClick={primaryButton.onClick}
                  className="btn-primary px-8 py-4 text-lg flex items-center gap-2 group"
                >
                  {primaryButton.text}
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              )}
              {secondaryButton && (
                <button
                  onClick={secondaryButton.onClick}
                  className="px-8 py-4 text-lg text-gray-700 hover:text-primary transition-colors flex items-center gap-2"
                >
                  {secondaryButton.text}
                  <ChevronDown size={20} />
                </button>
              )}
            </div>
          )}
          
          {badges && badges.length > 0 && (
            <p className="text-sm text-gray-500 mt-4">
              {badges.map((badge, index) => (
                <span key={index}>
                  {index > 0 && ' • '}
                  ✓ {badge}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
