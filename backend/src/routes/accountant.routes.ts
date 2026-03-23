import { Router } from 'express';
import accountantController from '../controllers/accountant.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate as any);

// Recherche d'experts (pour les entreprises)
router.get('/search', accountantController.search.bind(accountantController) as any);

// Saisie assistée des cabinets (type LinkedIn) pour éviter les doublons / fautes
router.get('/firms', accountantController.searchFirms.bind(accountantController) as any);

// Gestion des invitations (pour les experts)
router.get('/invitations', accountantController.getInvitations.bind(accountantController) as any);
router.post('/invitations/:id/accept', accountantController.acceptInvitation.bind(accountantController) as any);
router.post('/invitations/:id/reject', accountantController.rejectInvitation.bind(accountantController) as any);

// Entreprises gérées (pour les experts)
router.get('/companies', accountantController.getManagedCompanies.bind(accountantController) as any);

// Dashboard stats consolidées (pour les experts)
router.get('/dashboard-stats', accountantController.getDashboardStats.bind(accountantController) as any);

// Experts d'une entreprise
router.get('/company/:companyId', accountantController.getCompanyAccountants.bind(accountantController) as any);

// Révocation d'un expert (par une entreprise)
router.delete('/relations/:id', accountantController.revoke.bind(accountantController) as any);

// Profil expert (création/mise à jour)
router.post('/profile', accountantController.createOrUpdateProfile.bind(accountantController) as any);
router.put('/profile', accountantController.updateProfile.bind(accountantController) as any);

// Création du propre cabinet de l'expert
router.post('/cabinet', accountantController.createCabinet.bind(accountantController) as any);

// Profil d'un expert (par ID) - placé en dernier pour ne pas intercepter les routes plus spécifiques
router.get('/:id', accountantController.getProfile.bind(accountantController) as any);

export default router;

