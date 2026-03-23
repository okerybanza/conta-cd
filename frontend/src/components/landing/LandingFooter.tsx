import { useNavigate } from 'react-router-dom';

interface FooterLink {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface LandingFooterProps {
  footerImageUrl?: string;
  sections?: FooterSection[];
  copyrightText?: string;
}

export default function LandingFooter({
  footerImageUrl = '/images/design/footer.jpeg',
  sections,
  copyrightText,
}: LandingFooterProps) {
  const navigate = useNavigate();

  const defaultSections: FooterSection[] = sections || [
    {
      title: 'Produit',
      links: [
        { label: 'Fonctionnalités', href: '/#features' },
        { label: 'Tarifs', href: '/#pricing' },
        { label: 'Sécurité', href: '#' },
      ],
    },
    {
      title: 'Entreprise',
      links: [
        { label: 'À propos', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Carrières', href: '#' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'FAQ', href: '/#faq' },
        { label: 'Documentation', href: '#' },
        { label: 'Contact', href: '/contact' },
      ],
    },
  ];

  const handleLinkClick = (link: FooterLink) => {
    if (link.onClick) {
      link.onClick();
    } else if (link.href) {
      if (link.href.startsWith('#')) {
        // Scroll vers l'ancre
        const element = document.querySelector(link.href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (link.href.startsWith('/')) {
        navigate(link.href);
      } else {
        window.open(link.href, '_blank');
      }
    }
  };

  return (
    <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Image de design - Footer */}
        {footerImageUrl && (
          <div className="mb-8">
            <img 
              src={footerImageUrl} 
              alt="Footer Conta" 
              className="w-full h-auto rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <span className="ml-2 text-xl font-bold">Conta</span>
            </div>
            <p className="text-gray-400">
              La solution de gestion financière pour les entreprises modernes.
            </p>
          </div>
          
          {defaultSections.map((section, index) => (
            <div key={index}>
              <h4 className="font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-2 text-gray-400">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <button
                      onClick={() => handleLinkClick(link)}
                      className="hover:text-white transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
          <p>
            {copyrightText || `© ${new Date().getFullYear()} Conta. Tous droits réservés.`}
          </p>
        </div>
      </div>
    </footer>
  );
}
