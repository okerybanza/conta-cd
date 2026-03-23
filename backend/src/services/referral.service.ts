import prisma from '../config/database';
import logger from '../utils/logger';
import cacheService from './cache.service';

export class ReferralService {

  private generateCode(userId: string): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const suffix = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `CONTA-${suffix}`;
  }

  async getOrCreateReferralCode(userId: string): Promise<string> {
    const user = await (prisma as any).users.findUnique({ where: { id: userId }, select: { referral_code: true } });
    if (user?.referral_code) return user.referral_code;

    let code = this.generateCode(userId);
    // S'assurer de l'unicité
    let exists = await (prisma as any).users.findUnique({ where: { referral_code: code } });
    while (exists) {
      code = this.generateCode(userId);
      exists = await (prisma as any).users.findUnique({ where: { referral_code: code } });
    }

    await (prisma as any).users.update({ where: { id: userId }, data: { referral_code: code } });
    logger.info('Referral code generated', { userId, code });
    return code;
  }

  async setRewardType(userId: string, rewardType: 'months' | 'commission'): Promise<void> {
    await (prisma as any).users.update({
      where: { id: userId },
      data: { referral_reward_type: rewardType },
    });
    logger.info('Referral reward type updated', { userId, rewardType });
  }

  async applyReferralCode(newUserId: string, code: string): Promise<boolean> {
    const referrer = await (prisma as any).users.findUnique({
      where: { referral_code: code },
      select: { id: true, referral_reward_type: true, referral_commission_rate: true },
    });

    if (!referrer || referrer.id === newUserId) return false;

    // Créer l'entrée referral
    await (prisma as any).referrals.create({
      data: {
        referrer_id: referrer.id,
        referee_id: newUserId,
        referral_code: code,
        status: 'pending',
        reward_type: referrer.referral_reward_type || 'months',
        reward_value: referrer.referral_reward_type === 'commission' ? (referrer.referral_commission_rate || 0.05) : 1,
      },
    });

    // Marquer le nouvel utilisateur comme parrainé
    await (prisma as any).users.update({
      where: { id: newUserId },
      data: { referred_by: referrer.id },
    });

    logger.info('Referral applied', { referrerId: referrer.id, refereeId: newUserId, code });
    return true;
  }

  async activateReferral(refereeId: string): Promise<void> {
    const referral = await (prisma as any).referrals.findFirst({
      where: { referee_id: refereeId, status: 'pending' },
      include: { referrer: { select: { id: true, referral_reward_type: true, referral_credits: true } } },
    });

    if (!referral) return;

    await (prisma as any).referrals.update({
      where: { id: referral.id },
      data: { status: 'active', activated_at: new Date() },
    });

    // Appliquer la récompense au parrain
    if (referral.reward_type === 'months') {
      await (prisma as any).users.update({
        where: { id: referral.referrer_id },
        data: { referral_credits: { increment: 1 } },
      });
      logger.info('Referral reward applied - 1 month credit', { referrerId: referral.referrer_id });
    } else {
      logger.info('Referral commission pending payment', { referrerId: referral.referrer_id, rate: referral.reward_value });
    }
  }

  async getReferralStats(userId: string) {
    const cacheKey = `referral:stats:${userId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const [user, referrals] = await Promise.all([
      (prisma as any).users.findUnique({
        where: { id: userId },
        select: { referral_code: true, referral_reward_type: true, referral_credits: true, referral_commission_rate: true },
      }),
      (prisma as any).referrals.findMany({
        where: { referrer_id: userId },
        include: { referee: { select: { first_name: true, last_name: true, created_at: true } } },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    const stats = {
      referralCode: user?.referral_code || await this.getOrCreateReferralCode(userId),
      rewardType: user?.referral_reward_type || 'months',
      credits: user?.referral_credits || 0,
      commissionRate: user?.referral_commission_rate || 0.05,
      totalReferrals: referrals.length,
      activeReferrals: referrals.filter((r: any) => r.status === 'active').length,
      pendingReferrals: referrals.filter((r: any) => r.status === 'pending').length,
      referrals: referrals.map((r: any) => ({
        name: `${r.referee?.first_name || ''} ${r.referee?.last_name || ''}`.trim() || 'Anonyme',
        status: r.status,
        joinedAt: r.created_at,
        activatedAt: r.activated_at,
        rewardType: r.reward_type,
        rewardValue: r.reward_value,
      })),
    };

    await cacheService.set(cacheKey, stats, 300);
    return stats;
  }
}

export default new ReferralService();
