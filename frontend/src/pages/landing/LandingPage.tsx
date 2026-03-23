import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowRight,
  BarChart3,
  FileText,
  CreditCard,
  Users,
  Shield,
  TrendingUp,
  Calculator,
  Receipt,
  Building2,
  Star,
  ChevronDown,
  Menu,
  X,
  DollarSign,
} from 'lucide-react';
import { useState } from 'react';

function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = [
    {
      icon: FileText,
      title: 'Facturation Professionnelle',
      description: 'Créez et gérez vos factures en quelques clics. Templates personnalisables et export PDF.',
    },
    {
      icon: BarChart3,
      title: 'Rapports & Analyses',
      description: 'Tableaux de bord détaillés et rapports financiers pour suivre votre activité.',
    },
    {
      icon: CreditCard,
      title: 'Gestion des Paiements',
      description: 'Suivez les paiements, envoyez des rappels et gérez votre trésorerie efficacement.',
    },
    {
      icon: Receipt,
      title: 'Dépenses & Fournisseurs',
      description: 'Enregistrez vos dépenses, gérez vos fournisseurs et optimisez vos coûts.',
    },
    {
      icon: Calculator,
      title: 'Comptabilité Complète',
      description: 'Plan comptable, écritures, exercices fiscaux et états financiers conformes.',
    },
    {
      icon: Users,
      title: 'Gestion Clients',
      description: 'Base de données clients complète avec historique des transactions.',
    },
    {
      icon: Building2,
      title: 'Ressources Humaines',
      description: 'Gestion des employés, pointage, paie et conformité légale RDC.',
    },
    {
      icon: Shield,
      title: 'Sécurité & Conformité',
      description: 'Données chiffrées, sauvegardes automatiques et conformité fiscale.',
    },
  ];

  const plans = [
    {
      name: 'Starter',
      price: '29',
      description: 'Parfait pour les petites entreprises',
      features: [
        'Jusqu\'à 50 clients',
        'Jusqu\'à 100 factures/mois',
        'Gestion de base',
        'Support email',
        'Rapports essentiels',
      ],
      popular: false,
    },
    {
      name: 'Professional',
      price: '79',
      description: 'Pour les entreprises en croissance',
      features: [
        'Clients illimités',
        'Factures illimitées',
        'Module dépenses',
        'Comptabilité avancée',
        'Support prioritaire',
        'Rapports avancés',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: '199',
      description: 'Pour les grandes entreprises',
      features: [
        'Tout de Professional',
        'Multi-devises',
        'API Access',
        'Branding personnalisé',
        'Support dédié',
        'Workflows automatisés',
      ],
      popular: false,
    },
  ];

  const testimonials = [
    {
      name: 'Jean Mukamba',
      role: 'Directeur, Tech Solutions RDC',
      content: 'Conta a transformé notre gestion financière. Nous économisons des heures chaque semaine.',
      rating: 5,
    },
    {
      name: 'Marie Kabila',
      role: 'Comptable, Services Plus',
      content: 'L\'interface est intuitive et les rapports sont complets. Exactement ce dont nous avions besoin.',
      rating: 5,
    },
    {
      name: 'Paul Tshisekedi',
      role: 'Entrepreneur, Commerce Digital',
      content: 'La facturation est devenue un jeu d\'enfant. Nos clients apprécient la rapidité et le professionnalisme.',
      rating: 5,
    },
  ];

  const faqs = [
    {
      question: 'Puis-je essayer Conta gratuitement ?',
      answer: 'Oui ! Nous offrons une période d\'essai de 14 jours sans carte bancaire. Vous pouvez tester toutes les fonctionnalités.',
    },
    {
      question: 'Quels moyens de paiement acceptez-vous ?',
      answer: 'Nous acceptons les cartes bancaires, virements bancaires et paiements mobiles. La facturation est mensuelle.',
    },
    {
      question: 'Puis-je changer de plan à tout moment ?',
      answer: 'Absolument ! Vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements prennent effet immédiatement.',
    },
    {
      question: 'Mes données sont-elles sécurisées ?',
      answer: 'Oui, nous utilisons un chiffrement de niveau bancaire, des sauvegardes quotidiennes et respectons les normes de sécurité les plus strictes.',
    },
    {
      question: 'Offrez-vous un support en français ?',
      answer: 'Oui, notre équipe de support est disponible en français et répond généralement dans les 24 heures.',
    },
    {
      question: 'Puis-je exporter mes données ?',
      answer: 'Oui, vous pouvez exporter toutes vos données à tout moment au format Excel, PDF ou CSV.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">C</span>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">Conta</span>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-primary transition-colors">
                Fonctionnalités
              </a>
              <a href="/plans" className="text-gray-700 hover:text-primary transition-colors">
                Tarifs
              </a>
              <a href="#faq" className="text-gray-700 hover:text-primary transition-colors">
                FAQ
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
              <a href="#features" className="block text-gray-700 hover:text-primary">Fonctionnalités</a>
              <a href="/plans" className="block text-gray-700 hover:text-primary">Tarifs</a>
              <a href="#faq" className="block text-gray-700 hover:text-primary">FAQ</a>
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

      {/* Hero Section - Recréé selon le design home.jpeg */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Section Hero principale selon design */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            {/* Colonne gauche - Texte */}
            <div className="space-y-6">
              <div className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-4">
                Nouveau
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                La Gestion Financière
                <br />
                <span className="text-primary">Simplifiée</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Facturation, comptabilité, rapports et plus encore. Tout ce dont votre entreprise a besoin
                pour gérer ses finances en un seul endroit.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={() => navigate('/register')}
                  className="bg-primary text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-dark transition-colors inline-flex items-center justify-center gap-2 group shadow-lg"
                >
                  Commencer gratuitement
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => {
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-8 py-4 text-lg text-gray-700 hover:text-primary transition-colors flex items-center justify-center gap-2 border-2 border-gray-300 rounded-lg hover:border-primary"
                >
                  En savoir plus
                  <ChevronDown size={20} />
                </button>
              </div>
              <div className="flex items-center gap-6 pt-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-600" />
                  <span>Essai gratuit 14 jours</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-600" />
                  <span>Sans carte bancaire</span>
                </div>
              </div>
            </div>
            
            {/* Colonne droite - Illustration/Graphique selon design */}
            <div className="relative">
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 shadow-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-md">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                      <FileText className="text-blue-600" size={24} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">1,234</p>
                    <p className="text-sm text-gray-600">Factures</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-md">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                      <DollarSign className="text-green-600" size={24} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">$45K</p>
                    <p className="text-sm text-gray-600">Revenus</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-md">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                      <Users className="text-purple-600" size={24} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">567</p>
                    <p className="text-sm text-gray-600">Clients</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-md">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                      <TrendingUp className="text-orange-600" size={24} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">+23%</p>
                    <p className="text-sm text-gray-600">Croissance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Fonctionnalités - Recréée selon design home page 2.webp */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Une solution complète pour gérer toutes les facettes de votre entreprise
            </p>
          </div>
          
          {/* Grille de fonctionnalités selon design */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white p-6 rounded-xl border border-gray-200 hover:border-primary hover:shadow-xl transition-all group cursor-pointer"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:from-primary group-hover:to-primary-dark transition-all">
                    <Icon className="text-primary group-hover:text-white transition-colors" size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section Tarifs - Recréée selon design */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Tarifs Transparents
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choisissez le plan qui correspond à vos besoins. Changez à tout moment.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-8 border-2 relative ${
                  plan.popular
                    ? 'border-primary shadow-2xl scale-105'
                    : 'border-gray-200 hover:border-primary/50 shadow-lg'
                } transition-all`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg">
                      Le plus populaire
                    </div>
                  </div>
                )}
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-gray-600 ml-2 text-lg">/mois</span>
                    </div>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start">
                        <CheckCircle2 size={20} className="text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate('/register')}
                    className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
                      plan.popular
                        ? 'bg-primary text-white hover:bg-primary-dark shadow-lg'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    Commencer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Témoignages - Recréée selon design */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Ce que disent nos clients
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Des entreprises de toutes tailles nous font confiance
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={20} className="text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic text-lg leading-relaxed">"{testimonial.content}"</p>
                <div className="pt-4 border-t border-gray-100">
                  <p className="font-bold text-gray-900 text-lg">{testimonial.name}</p>
                  <p className="text-sm text-gray-600 mt-1">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section FAQ - Recréée selon design */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Questions Fréquentes
            </h2>
            <p className="text-xl text-gray-600">
              Tout ce que vous devez savoir sur Conta
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
                  className="w-full px-8 py-6 flex justify-between items-center text-left hover:bg-gray-50 transition-colors"
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
                  <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section CTA Finale - Recréée selon design */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary via-primary-dark to-primary">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Prêt à transformer votre gestion financière ?
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto">
            Rejoignez des centaines d'entreprises qui font confiance à Conta
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <button
              onClick={() => navigate('/register')}
              className="bg-white text-primary px-10 py-5 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all inline-flex items-center gap-3 group shadow-2xl transform hover:scale-105"
            >
              Commencer gratuitement
              <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="bg-transparent border-2 border-white text-white px-10 py-5 rounded-xl font-bold text-lg hover:bg-white/10 transition-all"
            >
              Nous contacter
            </button>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-6 text-white/90 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-white" />
              <span>Essai gratuit de 14 jours</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-white" />
              <span>Aucune carte bancaire requise</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-white" />
              <span>Annulation à tout moment</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Recréé selon design footer.jpeg */}
      <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section principale du footer selon design */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Colonne 1 - Logo et description */}
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
              {/* Réseaux sociaux selon design */}
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
            
            {/* Colonne 2 - Produit */}
            <div>
              <h4 className="font-bold text-lg mb-6">Produit</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <a href="#features" className="hover:text-white transition-colors inline-block">
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
            
            {/* Colonne 3 - Entreprise */}
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
            
            {/* Colonne 4 - Support */}
            <div>
              <h4 className="font-bold text-lg mb-6">Support</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <a href="#faq" className="hover:text-white transition-colors inline-block">
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
          
          {/* Ligne de séparation et copyright selon design */}
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

export default LandingPage;

