"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const platform_branding_service_1 = __importDefault(require("../services/platform-branding.service"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const superadmin_middleware_1 = require("../middleware/superadmin.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const env_1 = __importDefault(require("../config/env"));
const router = (0, express_1.Router)();
/**
 * @route   GET /api/v1/branding
 * @desc    Obtenir le branding de la plateforme (route publique)
 * @access  Public
 */
router.get('/', async (req, res, next) => {
    try {
        const branding = await platform_branding_service_1.default.getBranding();
        res.json({
            success: true,
            data: branding,
        });
    }
    catch (error) {
        // Si erreur, retourner des valeurs par défaut au lieu d'erreur 500
        console.error('Error fetching branding:', error);
        res.json({
            success: true,
            data: {
                id: '',
                logoUrl: '/uploads/logos/logo-color.png',
                faviconUrl: '/uploads/logos/icon-color.png',
                emailLogoUrl: '/uploads/logos/logo-color.png',
                pdfLogoUrl: '/uploads/logos/logo-color.png',
                primaryColor: '#0D3B66',
                secondaryColor: null,
                accentColor: null,
                backgroundColor: '#FFFFFF',
                primaryFont: 'Arial, sans-serif',
                secondaryFont: null,
                theme: 'light',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        });
    }
});
/**
 * @route   PUT /api/v1/branding
 * @desc    Mettre à jour le branding de la plateforme (Super Admin uniquement)
 * @access  Private (Super Admin)
 */
router.put('/', auth_middleware_1.authenticate, (0, superadmin_middleware_1.requireSuperAdmin)(), async (req, res, next) => {
    try {
        const branding = await platform_branding_service_1.default.updateBranding(req.user.id, req.body);
        res.json({
            success: true,
            data: branding,
            message: 'Branding mis à jour avec succès',
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route   POST /api/v1/branding/reset
 * @desc    Réinitialiser le branding aux valeurs par défaut (Super Admin uniquement)
 * @access  Private (Super Admin)
 */
router.post('/reset', auth_middleware_1.authenticate, (0, superadmin_middleware_1.requireSuperAdmin)(), async (req, res, next) => {
    try {
        const branding = await platform_branding_service_1.default.resetBranding(req.user.id);
        res.json({
            success: true,
            data: branding,
            message: 'Branding réinitialisé aux valeurs par défaut',
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route   POST /api/v1/branding/upload/:type
 * @desc    Uploader un logo (logo, favicon, emailLogo, pdfLogo) (Super Admin uniquement)
 * @access  Private (Super Admin)
 */
router.post('/upload/:type', auth_middleware_1.authenticate, (0, superadmin_middleware_1.requireSuperAdmin)(), upload_middleware_1.uploadLogo.single('file'), upload_middleware_1.handleUploadError, async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Aucun fichier uploadé',
            });
        }
        const type = req.params.type;
        const validTypes = ['logo', 'favicon', 'emailLogo', 'pdfLogo'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: `Type invalide. Types acceptés: ${validTypes.join(', ')}`,
            });
        }
        // Construire l'URL complète du logo
        const baseUrl = process.env.BACKEND_URL || env_1.default.FRONTEND_URL || (req.protocol + '://' + req.get('host'));
        const logoUrl = `/uploads/logos/${req.file.filename}`;
        // Mettre à jour le branding avec le nouveau logo
        const updateData = {};
        if (type === 'logo') {
            updateData.logoUrl = logoUrl;
        }
        else if (type === 'favicon') {
            updateData.faviconUrl = logoUrl;
        }
        else if (type === 'emailLogo') {
            updateData.emailLogoUrl = logoUrl;
        }
        else if (type === 'pdfLogo') {
            updateData.pdfLogoUrl = logoUrl;
        }
        const branding = await platform_branding_service_1.default.updateBranding(req.user.id, updateData);
        res.json({
            success: true,
            data: {
                url: logoUrl,
                branding,
            },
            message: `${type === 'logo' ? 'Logo' : type === 'favicon' ? 'Favicon' : type === 'emailLogo' ? 'Logo email' : 'Logo PDF'} uploadé avec succès`,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=branding.routes.js.map