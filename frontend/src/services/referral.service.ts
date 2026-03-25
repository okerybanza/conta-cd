import api from './api';

export interface ReferralProgram {
  id: string;
  isActive: boolean;
  referrerReward: number;
  refereeReward: number;
  rewardType: 'discount' | 'credit' | 'free_month';
  currency?: string;
  minimumPurchase?: number;
  expiryDays?: number;
}

export interface ReferralCode {
  id: string;
  code: string;
  userId: string;
  uses: number;
  maxUses?: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  refereeId: string;
  referralCode: string;
  status: 'pending' | 'completed' | 'rewarded' | 'expired';
  referrerReward?: number;
  refereeReward?: number;
  completedAt?: string;
  rewardedAt?: string;
  createdAt: string;
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalRewardsEarned: number;
  currency?: string;
  conversionRate: number;
}

class ReferralService {
  async getProgram(): Promise<ReferralProgram> {
    const response = await api.get('/referral/program');
    return response.data.data || response.data;
  }

  async getMyCode(): Promise<ReferralCode> {
    const response = await api.get('/referral/my-code');
    return response.data.data || response.data;
  }

  async generateCode(): Promise<ReferralCode> {
    const response = await api.post('/referral/generate-code');
    return response.data.data || response.data;
  }

  async validateCode(code: string): Promise<{
    valid: boolean;
    referralCode?: ReferralCode;
    error?: string;
  }> {
    const response = await api.post('/referral/validate-code', { code });
    return response.data.data || response.data;
  }

  async applyCode(code: string): Promise<{
    success: boolean;
    referral?: Referral;
    reward?: number;
  }> {
    const response = await api.post('/referral/apply-code', { code });
    return response.data.data || response.data;
  }

  async getMyReferrals(params?: { status?: string; page?: number; limit?: number }): Promise<{
    data: Referral[];
    pagination?: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const response = await api.get('/referral/my-referrals', { params });
    return response.data;
  }

  async getStats(): Promise<ReferralStats> {
    const response = await api.get('/referral/stats');
    return response.data.data || response.data;
  }

  async shareViaEmail(emails: string[], message?: string): Promise<{ success: boolean; sent: number }> {
    const response = await api.post('/referral/share-email', { emails, message });
    return response.data.data || response.data;
  }

  async getShareLinks(): Promise<{
    facebook: string;
    twitter: string;
    linkedin: string;
    whatsapp: string;
    email: string;
  }> {
    const response = await api.get('/referral/share-links');
    return response.data.data || response.data;
  }

  async claimReward(referralId: string): Promise<{
    success: boolean;
    reward: number;
    currency?: string;
  }> {
    const response = await api.post(`/referral/${referralId}/claim-reward`);
    return response.data.data || response.data;
  }
}

export default new ReferralService();
