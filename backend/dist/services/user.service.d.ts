export interface InviteUserData {
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    permissions?: Record<string, any>;
}
export interface CreateUserData {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role: string;
    permissions?: Record<string, any>;
}
export interface UpdateUserData {
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: string;
    permissions?: Record<string, any>;
    lockedUntil?: Date | null;
}
export interface UserFilters {
    role?: string;
    search?: string;
}
export declare class UserService {
    /**
     * Inviter un utilisateur par email
     */
    inviteUser(companyId: string, inviterId: string, data: InviteUserData): Promise<any>;
    /**
     * Créer un utilisateur directement (avec mot de passe)
     */
    createUser(companyId: string, creatorId: string, data: CreateUserData): Promise<any>;
    /**
     * Lister les utilisateurs d'une entreprise
     */
    listUsers(companyId: string, filters?: UserFilters): Promise<any>;
    /**
     * Obtenir un utilisateur par ID
     */
    getUserById(companyId: string, userId: string): Promise<any>;
    /**
     * Mettre à jour l'URL de l'avatar de l'utilisateur connecté
     */
    updateAvatarUrl(userId: string, avatarUrl: string): Promise<string>;
    /**
     * Mettre à jour un utilisateur
     */
    updateUser(companyId: string, userId: string, updaterId: string, data: UpdateUserData): Promise<any>;
    /**
     * Supprimer un utilisateur (soft delete)
     * DÉPRÉCIÉ : Utiliser accountDeletionService.deleteAccount() à la place
     * Conservé pour compatibilité ascendante
     */
    deleteUser(companyId: string, userId: string, deleterId: string): Promise<{
        success: boolean;
        userId: any;
        originalEmail: any;
        gracePeriodEnd: Date;
        canRestore: boolean;
        message: string;
    }>;
    /**
     * Réinitialiser le mot de passe d'un utilisateur (admin seulement)
     */
    resetUserPassword(companyId: string, userId: string, adminId: string, newPassword: string): Promise<{
        success: boolean;
    }>;
}
declare const _default: UserService;
export default _default;
//# sourceMappingURL=user.service.d.ts.map