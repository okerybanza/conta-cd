import { useEffect, useState } from 'react';
import referralService, { ReferralProgram, ReferralCode, Referral, ReferralStats } from '../../services/referral.service';
import { useToastContext } from '../../contexts/ToastContext';
import { Copy, Mail, Share2, Gift, Users, TrendingUp } from 'lucide-react';

export default function ReferralPage() {
  const { showSuccess, showError } = useToastContext();
  const [program, setProgram] = useState<ReferralProgram | null>(null);
  const [myCode, setMyCode] = useState<ReferralCode | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [shareLinks, setShareLinks] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [programData, codeData, statsData, referralsData, linksData] = await Promise.all([
        referralService.getProgram(),
        referralService.getMyCode(),
        referralService.getStats(),
        referralService.getMyReferrals({ limit: 10 }),
        referralService.getShareLinks(),
      ]);
      setProgram(programData);
      setMyCode(codeData);
      setStats(statsData);
      setReferrals(referralsData.data || []);
      setShareLinks(linksData);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (myCode) {
      navigator.clipboard.writeText(myCode.code);
      showSuccess('Code copié dans le presse-papier');
    }
  };

  const handleShareEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const emails = emailInput.split(',').map(e => e.trim()).filter(e => e);
    if (emails.length === 0) return;

    try {
      const result = await referralService.shareViaEmail(emails);
      showSuccess(`${result.sent} email(s) envoyé(s)`);
      setEmailInput('');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de l\'envoi');
    }
  };

  const getRewardText = () => {
    if (!program) return '';
    const { referrerReward, rewardType, currency } = program;
    if (rewardType === 'discount') return `${referrerReward}% de réduction`;
    if (rewardType === 'credit') return `${referrerReward} ${currency || 'USD'} de crédit`;
    if (rewardType === 'free_month') return `${referrerReward} mois gratuit(s)`;
    return '';
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">En attente</span>,
      completed: <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Complété</span>,
      rewarded: <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Récompensé</span>,
      expired: <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Expiré</span>,
    };
    return badges[status as keyof typeof badges] || status;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="card p-6">
          <p className="text-center text-text-secondary">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!program?.isActive) {
    return (
      <div className="p-6">
        <div className="card p-6 text-center">
          <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Programme de parrainage désactivé</h2>
          <p className="text-text-secondary">Le programme de parrainage n'est pas disponible pour le moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Programme de parrainage</h1>
        <p className="text-text-secondary text-sm mt-1">
          Parrainez vos amis et gagnez des récompenses
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-text-secondary">Total parrainages</p>
              <p className="text-2xl font-bold">{stats?.totalReferrals || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-text-secondary">Complétés</p>
              <p className="text-2xl font-bold">{stats?.completedReferrals || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <Gift className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-text-secondary">Récompenses</p>
              <p className="text-2xl font-bold">{stats?.totalRewardsEarned || 0} {stats?.currency || 'USD'}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-text-secondary">Taux conversion</p>
              <p className="text-2xl font-bold">{stats?.conversionRate || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mon code */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Votre code de parrainage</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <code className="text-2xl font-mono font-bold text-primary flex-1">{myCode?.code}</code>
              <button
                onClick={handleCopyCode}
                className="btn-secondary flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copier
              </button>
            </div>
          </div>
        </div>
        <p className="text-sm text-text-secondary mb-4">
          Partagez ce code avec vos amis. Vous recevrez {getRewardText()} pour chaque parrainage réussi.
        </p>

        {/* Partage social */}
        {shareLinks && (
          <div className="flex gap-2 flex-wrap">
            <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              Facebook
            </a>
            <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              Twitter
            </a>
            <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              LinkedIn
            </a>
            <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              WhatsApp
            </a>
          </div>
        )}
      </div>

      {/* Partage par email */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Inviter par email
        </h2>
        <form onSubmit={handleShareEmail} className="flex gap-2">
          <input
            type="text"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="email1@example.com, email2@example.com"
            className="input flex-1"
          />
          <button type="submit" className="btn-primary">
            Envoyer
          </button>
        </form>
        <p className="text-xs text-text-secondary mt-2">Séparez plusieurs emails par des virgules</p>
      </div>

      {/* Liste des parrainages */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Mes parrainages</h2>
        {referrals.length === 0 ? (
          <p className="text-center text-text-secondary py-8">Aucun parrainage pour le moment</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Statut</th>
                  <th className="text-right py-2">Récompense</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral) => (
                  <tr key={referral.id} className="border-b">
                    <td className="py-3">{new Date(referral.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="py-3">{getStatusBadge(referral.status)}</td>
                    <td className="py-3 text-right">
                      {referral.referrerReward ? `${referral.referrerReward} ${stats?.currency || 'USD'}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
