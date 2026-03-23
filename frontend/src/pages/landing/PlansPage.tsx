import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Menu, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';

function PlansPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const plans = [
    {
      name: 'Gratuit',
      price: '0',
      currency: 'CDF',
      period: 'mois',
      description: 'Plan gratuit pour démarrer votre activité',
      features: [
        '20 clients',
        '20 factures/mois',
        'Produits illimités',
        '20 dépenses/mois',
        '10 fournisseurs',
        '50 emails/mois',
        '500 MB de stockage',
        '1 utilisateur',
        'Module Dépenses',
      ],
      popular: false,
      free: true,
    },
    {
      name: 'Pro',
      price: '20 000',
      currency: 'CDF',
      period: 'mois',
      description: 'Pour les petites entreprises en croissance',
      features: [
        'Clients illimités',
        'Factures illimitées',
        'Produits illimités',
        '200 dépenses/mois',
        '50 fournisseurs',
        '500 emails/mois',
        '200 SMS/mois',
        '2 GB de stockage',
        '5 utilisateurs',
        'Module Dépenses',
        'Comptabilité',
        'Factures Récurrentes',
        'Templates Personnalisés',
        'Multi-devises',
        'Rapports Avancés',
      ],
      popular: true,
      free: false,
    },
    {
      name: 'Expert',
      price: '50 000',
      currency: 'CDF',
      period: 'mois',
      description: 'Pour les moyennes et grandes entreprises',
      features: [
        'Tout illimité',
        '20 utilisateurs',
        '2000 emails/mois',
        '1000 SMS/mois',
        '10 GB de stockage',
        'Toutes les fonctionnalités',
        'Gestion de Stock',
        'Ressources Humaines',
        'API Access',
        'Workflows',
        'Branding Personnalisé',
      ],
      popular: false,
      free: false,
    },
  ];

  const faqs = [
    {
      question: 'Puis-je essayer Conta gratuitement ?',
      answer: 'Oui ! Nous offrons une période d\'essai de 14 jours sans carte bancaire. Vous pouvez tester toutes les fonctionnalités de nos plans Professional et Enterprise.',
    },
    {
      question: 'Quels moyens de paiement acceptez-vous ?',
      answer: 'Nous acceptons les cartes bancaires (Visa, MasterCard), les virements bancaires et les paiements mobiles (Maxicash, M-Pesa, Airtel Money). La facturation est mensuelle ou annuelle avec une remise.',
    },
    {
      question: 'Puis-je changer de plan à tout moment ?',
      answer: 'Absolument ! Vous pouvez upgrader ou downgrader votre plan à tout moment depuis votre tableau de bord. Les changements prennent effet immédiatement et nous ajustons la facturation proportionnellement.',
    },
    {
      question: 'Y a-t-il des frais cachés ?',
      answer: 'Non, nos tarifs sont entièrement transparents. Le prix affiché est le prix que vous payez. Il n\'y a aucun frais d\'installation, de configuration ou de résiliation.',
    },
    {
      question: 'Que se passe-t-il après l\'essai gratuit ?',
      answer: 'Après 14 jours, vous aurez la possibilité de choisir un plan payant pour continuer à utiliser Conta. Si vous ne choisissez pas de plan, votre compte sera mis en pause jusqu\'à ce que vous le fassiez. Aucune carte bancaire n\'est requise pour l\'essai, donc aucun prélèvement automatique ne sera effectué.',
    },
    {
      question: 'Offrez-vous des remises annuelles ?',
      answer: 'Oui, nous offrons une remise de 20% pour les abonnements annuels. Pour en savoir plus sur les options de paiement annuel, veuillez nous contacter.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ÉTAPE 1: Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button onClick={() => navigate('/')} className="flex items-center">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">C</span>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">Conta</span>
              </button>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="/#features" className="text-gray-700 hover:text-primary transition-colors">
                Fonctionnalités
              </a>
              <a href="/plans" className="text-primary font-semibold transition-colors">
                Tarifs
              </a>
              <a href="/contact" className="text-gray-700 hover:text-primary transition-colors">
                Contact
              </a>
              <button
                onClick={() => navigate('/login')}
                className="text-gray-700 hover:text-primary transition-colors"
              >
                Connexion
              </button>
              <button
                onClick={() => navigate('/register')}
                className="btn-primary px-6 py-2"
              >
                Essai gratuit
              </button>
            </div>
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-3">
              <a href="/#features" className="block text-gray-700 hover:text-primary">Fonctionnalités</a>
              <a href="/plans" className="block text-primary font-semibold">Tarifs</a>
              <a href="/contact" className="block text-gray-700 hover:text-primary">Contact</a>
              <button onClick={() => navigate('/login')} className="block text-gray-700 hover:text-primary w-full text-left">
                Connexion
              </button>
              <button onClick={() => navigate('/register')} className="btn-primary w-full">
                Essai gratuit
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ÉTAPE 2: Hero Section - Selon design Plan page.jpeg */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-block px-5 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold mb-6">
              Tarifs
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Choisissez votre Plan
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Des tarifs transparents adaptés à la taille de votre entreprise. Changez de plan à tout moment.
            </p>
          </div>
        </div>
      </section>

      {/* ÉTAPE 3: Section Plans - Selon design Plan page.jpeg */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-8 border-2 relative transition-all ${
                  plan.popular
                    ? 'border-primary shadow-2xl scale-105 z-10'
                    : 'border-gray-200 hover:border-primary/50 shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-primary text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg">
                      Le plus populaire
                    </div>
                  </div>
                )}
                
                <div className={plan.popular ? 'mt-2' : ''}>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6 text-base">{plan.description}</p>
                  
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-bold text-gray-900">{plan.price === '0' ? 'Gratuit' : `${plan.price} ${plan.currency || 'CDF'}`}</span>
                      {plan.price !== '0' && (
                        <span className="text-gray-600 ml-2 text-lg">/{plan.period}</span>
                      )}
                    </div>
                    {plan.price !== '0' && (
                      <p className="text-sm text-gray-500 mt-1">Facturation mensuelle</p>
                    )}
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start">
                        <CheckCircle2 size={18} className="text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button
                    onClick={() => navigate('/register')}
                    className={`w-full py-3 rounded-lg font-semibold text-base transition-all ${
                      plan.popular
                        ? 'bg-primary text-white hover:bg-primary-dark shadow-lg'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {plan.popular ? 'Commencer maintenant' : 'Choisir ce plan'}
                  </button>
                  
                  {plan.popular && (
                    <p className="text-center text-xs text-primary font-semibold mt-3">
                      ✓ Essai gratuit de 14 jours
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ÉTAPE 4: FAQ Section - Selon design Plan page.jpeg */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Questions Fréquentes sur les Tarifs
            </h2>
            <p className="text-xl text-gray-600">
              Tout ce que vous devez savoir sur nos plans et abonnements
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-primary transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 flex justify-between items-center text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-gray-900 text-lg pr-4">{faq.question}</span>
                  <ChevronDown
                    size={24}
                    className={`text-gray-500 flex-shrink-0 transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 py-5 border-t border-gray-200 bg-gray-50">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ÉTAPE 5: CTA Final Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary to-primary-dark">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Prêt à commencer ?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Rejoignez des centaines d'entreprises qui font confiance à Conta
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-white text-primary px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center gap-2 group shadow-xl"
          >
            Commencer gratuitement
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-white/80 text-sm mt-4">
            Essai gratuit de 14 jours • Aucune carte bancaire requise
          </p>
        </div>
      </section>

      {/* ÉTAPE 6: Footer - Selon design footer.jpeg */}
      <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">C</span>
                </div>
                <span className="ml-3 text-2xl font-bold">Conta</span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">
                La solution de gestion financière pour les entreprises modernes.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                  <span className="text-white text-sm">f</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                  <span className="text-white text-sm">t</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                  <span className="text-white text-sm">in</span>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-6">Produit</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <a href="/#features" className="hover:text-white transition-colors inline-block">
                    Fonctionnalités
                  </a>
                </li>
                <li>
                  <a href="/plans" className="hover:text-white transition-colors inline-block">
                    Tarifs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors inline-block">
                    Sécurité
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors inline-block">
                    Intégrations
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-6">Entreprise</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors inline-block">
                    À propos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors inline-block">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors inline-block">
                    Carrières
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors inline-block">
                    Partenaires
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-6">Support</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <a href="/#faq" className="hover:text-white transition-colors inline-block">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors inline-block">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="/contact" className="hover:text-white transition-colors inline-block">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors inline-block">
                    Support
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} Conta. Tous droits réservés.
              </p>
              <div className="flex gap-6 text-sm text-gray-400">
                <a href="#" className="hover:text-white transition-colors">Mentions légales</a>
                <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
                <a href="#" className="hover:text-white transition-colors">CGU</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PlansPage;
