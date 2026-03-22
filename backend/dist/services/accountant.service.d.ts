export declare class AccountantService {
    /**
     * Rechercher des experts-comptables (users avec is_accountant=true et profil optionnel)
     */
    searchAccountants(filters: any): Promise<{
        data: any;
        pagination: {
            page: any;
            limit: any;
            total: any;
            totalPages: number;
        };
    }>;
    /**
     * Rechercher des cabinets (entreprises de type EXPERT_COMPTABLE)
     */
    searchFirms(filters: any): Promise<{
        data: any;
        pagination: {
            page: any;
            limit: any;
            total: any;
            totalPages: number;
        };
    }>;
    /**
     * Obtenir le profil public d'un expert-comptable (même format que la recherche).
     * Compatible avec ou sans les colonnes optionnelles (bio, certifications, etc.) en base.
     */
    getAccountantProfile(userId: string): Promise<{
        id: any;
        userId: any;
        firstName: any;
        lastName: any;
        email: any;
        companyName: any;
        registrationNumber: any;
        specialization: any;
        experienceYears: any;
        country: any;
        province: any;
        city: any;
        address: any;
        professionalEmail: any;
        phone: any;
        website: any;
        profilePhotoUrl: any;
        isAvailable: any;
        maxCompanies: any;
        rating: number | null;
        totalReviews: any;
        totalCompanies: any;
        activeCompaniesCount: any;
        bio: any;
        certifications: any;
        languages: any;
        linkedinUrl: any;
        businessHours: any;
        createdAt: any;
        updatedAt: any;
    }>;
    /**
     * Créer ou mettre à jour le profil d'un expert-comptable
     */
    createOrUpdateProfile(userId: string, data: any): Promise<any>;
    /**
     * Mettre à jour uniquement l'URL de la photo de profil de l'expert
     */
    updateProfilePhotoUrl(userId: string, profilePhotoUrl: string): Promise<any>;
    /**
     * Inviter un expert-comptable à rejoindre une entreprise
     */
    inviteAccountant(companyId: string, accountantId: string, invitedBy: string): Promise<any>;
    /**
     * Accepter une invitation
     */
    acceptInvitation(invitationId: string, accountantId: string): Promise<any>;
    /**
     * Rejeter une invitation
     */
    rejectInvitation(invitationId: string, accountantId: string): Promise<any>;
    /**
     * Obtenir les invitations d'un expert-comptable
     */
    getInvitations(accountantId: string): Promise<any>;
    /**
     * Lister les entreprises gérées par un expert
     */
    getManagedCompanies(accountantId: string): Promise<any>;
    /**
     * Lister les experts associés à une entreprise
     */
    getCompanyAccountants(companyId: string): Promise<any>;
    /**
     * Révoquer l'accès d'un expert-comptable
     */
    revokeAccountant(companyId: string, accountantId: string): Promise<any>;
    /**
     * Obtenir les statistiques du tableau de bord d'un expert-comptable
     */
    getDashboardStats(accountantId: string): Promise<{
        totalCompanies: any;
        activeCompanies: any;
        pendingInvitations: any;
        totalRevenue: number;
        totalInvoices: any;
        unpaidInvoices: any;
        companiesStats: any;
    }>;
    /**
     * Obtenir le cabinet de l'expert (son entreprise de type EXPERT_COMPTABLE)
     */
    getOwnCabinet(userId: string): Promise<any>;
    /**
     * Créer son propre cabinet (entreprise de type EXPERT_COMPTABLE)
     */
    createOwnCabinet(userId: string, data: any): Promise<any>;
    /**
     * Soumettre ou mettre à jour un avis sur un expert comptable.
     * Un seul avis par couple (company, accountant).
     */
    submitReview(data: {
        accountantId: string;
        companyId: string;
        reviewerId: string;
        rating: number;
        comment?: string;
    }): Promise<any>;
    /**
     * Récupérer les avis d'un expert comptable
     */
    getReviews(accountantId: string, page?: number, limit?: number): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    /**
     * Supprimer un avis (par l'auteur ou admin)
     */
    deleteReview(reviewId: string, userId: string, companyId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Recalculer la note moyenne d'un expert comptable
     */
    private recalculateRating;
}
declare const _default: AccountantService;
export default _default;
//# sourceMappingURL=accountant.service.d.ts.map