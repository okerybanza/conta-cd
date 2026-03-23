interface PackageBadgeProps {
  packageCode: string;
  className?: string;
}

export function PackageBadge({ packageCode, className = '' }: PackageBadgeProps) {
  const getPackageInfo = (code: string) => {
    switch (code.toLowerCase()) {
      case 'essential':
        return {
          name: 'Essential',
          color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
        };
      case 'professional':
        return {
          name: 'Professional',
          color: 'bg-primary/10 text-primary border-primary/20',
        };
      case 'enterprise':
        return {
          name: 'Enterprise',
          color: 'bg-accent/10 text-accent border-accent/20',
        };
      default:
        return {
          name: code,
          color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
        };
    }
  };

  const info = getPackageInfo(packageCode);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${info.color} ${className}`}
    >
      {info.name}
    </span>
  );
}

