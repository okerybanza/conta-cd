"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireContaPermission = requireContaPermission;
exports.checkContaPermission = checkContaPermission;
const error_middleware_1 = require("./error.middleware");
// TODO: Implémenter conta-permissions.service
// import contaPermissionsService from '../services/conta-permissions.service';
/**
 * Middleware pour vérifier une permission Conta spécifique
 */
function requireContaPermission(module, action) {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                throw new error_middleware_1.CustomError('User not authenticated', 401, 'NOT_AUTHENTICATED');
            }
            // Super Admin a toujours accès
            if (req.user.isSuperAdmin) {
                return next();
            }
            // Vérifier que c'est un utilisateur Conta
            if (!req.user.isContaUser) {
                throw new error_middleware_1.CustomError('Conta user access required', 403, 'CONTA_USER_REQUIRED');
            }
            // Vérifier la permission
            // TODO: Implémenter conta-permissions.service
            // const hasPermission = await contaPermissionsService.hasPermission(
            //   req.user.id,
            //   module as any,
            //   action
            // );
            // if (!hasPermission) {
            //   throw new CustomError(
            //     `Insufficient permissions: ${module}.${action}`,
            //     403,
            //     'INSUFFICIENT_PERMISSIONS'
            //   );
            // }
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
/**
 * Vérifier si un utilisateur a une permission (utilitaire)
 */
async function checkContaPermission(userId, module, action) {
    try {
        // TODO: Implémenter conta-permissions.service
        // const hasPermission = await contaPermissionsService.hasPermission(
        //   userId,
        //   module as any,
        //   action
        // );
        // return hasPermission;
        return true; // Temporaire : autoriser toutes les permissions
    }
    catch (error) {
        return false;
    }
}
//# sourceMappingURL=conta-permissions.middleware.js.map