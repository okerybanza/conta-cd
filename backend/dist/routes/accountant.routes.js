"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const accountant_controller_1 = __importDefault(require("../controllers/accountant.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_middleware_1.authenticate);
// Recherche d'experts (pour les entreprises)
router.get('/search', accountant_controller_1.default.search.bind(accountant_controller_1.default));
// Saisie assistée des cabinets (type LinkedIn) pour éviter les doublons / fautes
router.get('/firms', accountant_controller_1.default.searchFirms.bind(accountant_controller_1.default));
// Gestion des invitations (pour les experts)
router.get('/invitations', accountant_controller_1.default.getInvitations.bind(accountant_controller_1.default));
router.post('/invitations/:id/accept', accountant_controller_1.default.acceptInvitation.bind(accountant_controller_1.default));
router.post('/invitations/:id/reject', accountant_controller_1.default.rejectInvitation.bind(accountant_controller_1.default));
// Entreprises gérées (pour les experts)
router.get('/companies', accountant_controller_1.default.getManagedCompanies.bind(accountant_controller_1.default));
// Dashboard stats consolidées (pour les experts)
router.get('/dashboard-stats', accountant_controller_1.default.getDashboardStats.bind(accountant_controller_1.default));
// Experts d'une entreprise
router.get('/company/:companyId', accountant_controller_1.default.getCompanyAccountants.bind(accountant_controller_1.default));
// Révocation d'un expert (par une entreprise)
router.delete('/relations/:id', accountant_controller_1.default.revoke.bind(accountant_controller_1.default));
// Profil expert : GET propre profil (avant POST/PUT pour éviter conflit avec /:id)
router.get('/profile', accountant_controller_1.default.getOwnProfile.bind(accountant_controller_1.default));
router.post('/profile', accountant_controller_1.default.createOrUpdateProfile.bind(accountant_controller_1.default));
router.put('/profile', accountant_controller_1.default.updateProfile.bind(accountant_controller_1.default));
router.patch('/profile', accountant_controller_1.default.updateProfile.bind(accountant_controller_1.default));
router.post('/profile/photo', upload_middleware_1.uploadAvatar.single('photo'), upload_middleware_1.handleUploadError, accountant_controller_1.default.uploadProfilePhoto.bind(accountant_controller_1.default));
// Cabinet de l'expert (GET avant POST pour éviter que /:id n'intercepte "cabinet")
router.get('/cabinet', accountant_controller_1.default.getCabinet.bind(accountant_controller_1.default));
router.post('/cabinet', accountant_controller_1.default.createCabinet.bind(accountant_controller_1.default));
// Invitation d'un expert par une entreprise (via body)
router.post('/invite', accountant_controller_1.default.invite.bind(accountant_controller_1.default));
// Suppression d'un avis (par l'auteur ou admin)
router.delete('/reviews/:id', accountant_controller_1.default.deleteReview.bind(accountant_controller_1.default));
// Invitation d'un expert par une entreprise (via URL param)
router.post('/:id/invite', accountant_controller_1.default.invite.bind(accountant_controller_1.default));
// Avis sur un expert comptable
router.get('/:id/reviews', accountant_controller_1.default.getReviews.bind(accountant_controller_1.default));
router.post('/:id/reviews', accountant_controller_1.default.submitReview.bind(accountant_controller_1.default));
// Profil d'un expert (par ID) - placé en dernier pour ne pas intercepter les routes plus spécifiques
router.get('/:id', accountant_controller_1.default.getProfile.bind(accountant_controller_1.default));
exports.default = router;
//# sourceMappingURL=accountant.routes.js.map