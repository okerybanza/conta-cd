import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

function ContactPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // TODO: Implémenter l'envoi du formulaire
    setTimeout(() => {
      setSending(false);
      alert('Message envoyé avec succès !');
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
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
              <a href="/#pricing" className="text-gray-700 hover:text-primary transition-colors">
                Tarifs
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
          </div>
        </div>
      </nav>

      {/* Hero Section - Recréée selon design contact.jpeg */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6">
              Contact
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Contactez-nous
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Nous sommes là pour vous aider. N'hésitez pas à nous contacter pour toute question.
            </p>
          </div>
        </div>
      </section>

      {/* Formulaire de Contact - Recréé selon design contact.jpeg */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Informations de Contact - Colonne gauche selon design */}
            <div className="lg:col-span-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Informations</h2>
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="text-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">Email</h3>
                    <p className="text-gray-600">support@conta.cd</p>
                    <p className="text-gray-600">info@conta.cd</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="text-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">Téléphone</h3>
                    <p className="text-gray-600">+243 XXX XXX XXX</p>
                    <p className="text-gray-600">+243 XXX XXX XXX</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">Adresse</h3>
                    <p className="text-gray-600 leading-relaxed">Kinshasa,<br />République Démocratique du Congo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulaire - Colonne droite selon design */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-10 shadow-xl border border-gray-200">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Envoyez-nous un message</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-white"
                      placeholder="Votre nom"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-white"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Sujet
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-white"
                    placeholder="Sujet de votre message"
                  />
                </div>
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Message
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none bg-white"
                    placeholder="Votre message..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="bg-primary text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-primary-dark transition-all inline-flex items-center gap-3 shadow-lg disabled:opacity-50"
                >
                  <Send size={22} />
                  {sending ? 'Envoi en cours...' : 'Envoyer le message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Image de design - Footer */}
          <div className="mb-8">
            <img 
              src="/images/design/footer.jpeg" 
              alt="Footer Conta" 
              className="w-full h-auto rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          
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
            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/#features" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="/#pricing" className="hover:text-white transition-colors">Tarifs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Sécurité</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Entreprise</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">À propos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carrières</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Conta. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ContactPage;
