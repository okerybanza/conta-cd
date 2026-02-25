import type { AuthService } from './auth.service';
export interface OAuthUserInfo {
    email: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
}
/**
 * Construire l'URL de redirection Google (étape 1)
 */
export declare function getGoogleAuthUrl(redirectUri: string): string;
/**
 * Échanger le code Google contre les infos utilisateur (étape 2)
 */
export declare function getGoogleUserFromCode(code: string, redirectUri: string): Promise<OAuthUserInfo>;
/**
 * Trouver ou créer un utilisateur à partir des infos OAuth, puis retourner user + company + tokens.
 * Utilise le même format que login/verifyEmail pour le frontend.
 */
export declare function findOrCreateUserFromOAuth(oauthUser: OAuthUserInfo, authService: AuthService): Promise<{
    user: any;
    company: any;
    accessToken: string;
    refreshToken: string;
}>;
//# sourceMappingURL=auth-oauth.service.d.ts.map