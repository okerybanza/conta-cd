export declare class AuthService {
    generateEmailVerificationCode(): string;
    register(data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        companyName: string;
        accountType?: 'entrepreneur' | 'startup' | 'ong_firm' | 'expert_comptable';
    }): Promise<{
        devVerificationCode?: string | undefined;
        requiresEmailVerification: boolean;
        email: any;
        user: {
            id: any;
            email: any;
            firstName: any;
            lastName: any;
            role: any;
            emailVerified: boolean;
        };
        company: {
            id: any;
            name: any;
        };
    }>;
    resendEmailVerification(email: string): Promise<{
        success: boolean;
        alreadyVerified: boolean;
    } | {
        devVerificationCode?: string | undefined;
        success: boolean;
        alreadyVerified?: undefined;
    }>;
    /**
     * Dev-only helper: inspect email status for QA / support
     */
    getEmailStatus(email: string): Promise<{
        exists: boolean;
        emailVerified: boolean;
        deleted: boolean;
        userId: any;
        companyId: any;
        createdAt: any;
        lastLoginAt: any;
    } | {
        exists: boolean;
        emailVerified: null;
        deleted: null;
        userId: null;
        companyId: null;
        createdAt: null;
        lastLoginAt: null;
    }>;
    verifyEmail(email: string, code: string, ipAddress?: string): Promise<{
        accessToken: never;
        refreshToken: never;
        jti: `${string}-${string}-${string}-${string}-${string}`;
        user: {
            id: any;
            email: any;
            firstName: any;
            lastName: any;
            role: any;
            twoFactorEnabled: any;
            isSuperAdmin: any;
            isContaUser: any;
            contaRole: any;
            isAccountant: any;
            companyId: any;
        };
        company: {
            id: any;
            name: any;
        } | null;
    }>;
    login(data: {
        email: string;
        password: string;
        twoFactorCode?: string;
    }, ipAddress?: string): Promise<{
        accessToken: never;
        refreshToken: never;
        jti: `${string}-${string}-${string}-${string}-${string}`;
        user: {
            id: any;
            email: any;
            firstName: any;
            lastName: any;
            role: any;
            twoFactorEnabled: any;
            isSuperAdmin: any;
            isContaUser: any;
            contaRole: any;
            isAccountant: any;
            companyId: any;
        };
        company: {
            id: any;
            name: any;
        } | null;
    }>;
    generateTokens(user: any, company?: any): {
        accessToken: never;
        refreshToken: never;
        jti: `${string}-${string}-${string}-${string}-${string}`;
    };
    refreshToken(refreshToken: string): Promise<{
        accessToken: never;
        refreshToken: never;
        jti: `${string}-${string}-${string}-${string}-${string}`;
    }>;
    enable2FA(userId: string): Promise<{
        secret: string;
        qrCodeUrl: string;
        backupCodes: string[];
    }>;
    verifyAndEnable2FA(userId: string, token: string): Promise<{
        success: boolean;
    }>;
    disable2FA(userId: string, password: string): Promise<{
        success: boolean;
    }>;
    forgotPassword(email: string): Promise<{
        success: boolean;
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=auth.service.d.ts.map