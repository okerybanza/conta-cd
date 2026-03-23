import prisma from '../config/database';
import { CustomError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { Prisma } from '@prisma/client';

export interface CreateContractData {
  companyId?: string;
  accountantId?: string;
  type?: string;
  title?: string;
  content?: string;
  templateId?: string;
  fileUrl?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateContractData {
  title?: string;
  content?: string;
  templateId?: string;
  fileUrl?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface SignContractData {
  signature?: string; // URL ou données de signature
  signedBy?: string; // User ID
}

export interface ContractFilters {
  companyId?: string;
  accountantId?: string;
  status?: string;
  type?: string;
}

export class ContractService {
  /**
   * Créer un contrat
   */
  async create(data: CreateContractData) {
    // Vérifier que la relation entreprise-expert existe
    const relation = await prisma.company_accountants.findUnique({
      where: {
        company_id_accountant_id: {
          company_id: data.companyId,
          accountant_id: data.accountantId,
        },
      },
    });

    if (!relation) {
      throw new CustomError(
        'Company-Accountant relation not found',
        404,
        'RELATION_NOT_FOUND'
      );
    }

    // Vérifier qu'il n'y a pas déjà un contrat actif
    const existing = await prisma.contracts.findFirst({
      where: {
        company_id: data.companyId,
        accountant_id: data.accountantId,
        status: { in: ['draft', 'pending', 'signed'] },
      },
    });

    if (existing) {
      throw new CustomError(
        'Active contract already exists',
        409,
        'CONTRACT_EXISTS'
      );
    }

    const contract = await prisma.contracts.create({
      data: {
        company_id: data.companyId,
        accountant_id: data.accountantId,
        type: data.type || 'accountant_service',
        title: data.title,
        content: data.content,
        template_id: data.templateId,
        file_url: data.fileUrl,
        status: 'draft',
        start_date: data.startDate,
        end_date: data.endDate,
      },
      include: {
        companies: {
          select: {
            id: true,
            name: true,
            business_name: true,
          },
        },
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    // Lier le contrat à la relation
    await prisma.company_accountants.update({
      where: {
        company_id_accountant_id: {
          company_id: data.companyId,
          accountant_id: data.accountantId,
        },
      },
      data: {
        contract_id: contract.id,
      },
    });

    logger.info(`Contract created: ${contract.id}`, {
      companyId: data.companyId,
      accountantId: data.accountantId,
    });

    return contract;
  }

  /**
   * Obtenir un contrat par ID
   */
  async getById(contractId: string, companyId?: string, accountantId?: string) {
    const where: Prisma.contractsWhereInput = {
      id: contractId,
      ...(companyId && { company_id: companyId }),
      ...(accountantId && { accountant_id: accountantId }),
    };

    const contract = await prisma.contracts.findFirst({
      where,
      include: {
        companies: {
          select: {
            id: true,
            name: true,
            business_name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            country: true,
          },
        },
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            accountant_profile: true,
          },
        },
      },
    });

    if (!contract) {
      throw new CustomError('Contract not found', 404, 'CONTRACT_NOT_FOUND');
    }

    return contract;
  }

  /**
   * Lister les contrats avec filtres
   */
  async list(filters: ContractFilters = {}) {
    const where: Prisma.contractsWhereInput = {
      ...(filters.companyId && { company_id: filters.companyId }),
      ...(filters.accountantId && { accountant_id: filters.accountantId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.type && { type: filters.type }),
    };

    const contracts = await prisma.contracts.findMany({
      where,
      include: {
        companies: {
          select: {
            id: true,
            name: true,
            business_name: true,
          },
        },
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return contracts;
  }

  /**
   * Mettre à jour un contrat
   */
  async update(
    contractId: string,
    data: UpdateContractData,
    companyId?: string,
    accountantId?: string
  ) {
    const contract = await this.getById(contractId, companyId, accountantId);

    // Vérifier les permissions
    if (companyId && contract.company_id !== companyId) {
      throw new CustomError('Unauthorized', 403, 'UNAUTHORIZED');
    }
    if (accountantId && contract.accountant_id !== accountantId) {
      throw new CustomError('Unauthorized', 403, 'UNAUTHORIZED');
    }

    // Ne pas permettre la modification si signé
    if (contract.status === 'signed') {
      throw new CustomError(
        'Cannot update signed contract',
        400,
        'CONTRACT_SIGNED'
      );
    }

    const updated = await prisma.contracts.update({
      where: { id: contractId },
      data: {
        ...data,
        template_id: data.templateId,
        file_url: data.fileUrl,
        start_date: data.startDate,
        end_date: data.endDate,
        ...(data.status && { status: data.status }),
      },
      include: {
        companies: {
          select: {
            id: true,
            name: true,
            business_name: true,
          },
        },
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    logger.info(`Contract updated: ${contractId}`, {
      companyId: contract.company_id,
      accountantId: contract.accountant_id,
    });

    return updated;
  }

  /**
   * Signer un contrat (par l'entreprise)
   */
  async signByCompany(contractId: string, data: SignContractData) {
    const contract = await this.getById(contractId);

    // Vérifier que l'utilisateur appartient à l'entreprise
    const user = await prisma.users.findUnique({
      where: { id: data.signedBy },
    });

    if (!user || user.company_id !== contract.company_id) {
      throw new CustomError('Unauthorized', 403, 'UNAUTHORIZED');
    }

    if (contract.status !== 'pending' && contract.status !== 'draft') {
      throw new CustomError(
        `Contract is ${contract.status}, cannot sign`,
        400,
        'INVALID_STATUS'
      );
    }

    const updated = await prisma.contracts.update({
      where: { id: contractId },
      data: {
        status: 'signed_by_company',
        company_signed_at: new Date(),
        company_signature: data.signature,
        company_signed_by: data.signedBy,
        updated_at: new Date(),
      },
    });
    // The original code had this conditional logic, but the diff replaces it.
    // status: contract.accountantSignedAt ? 'signed' : 'pending',
    // signedAt: contract.accountantSignedAt ? new Date() : undefined,
    // },
    // });

    logger.info(`Contract signed by company: ${contractId}`, {
      companyId: contract.company_id,
      signedBy: data.signedBy,
    });

    // TODO: Envoyer notification à l'expert si les deux parties ont signé

    return updated;
  }

  /**
   * Signer un contrat (par l'expert)
   */
  async signByAccountant(contractId: string, data: SignContractData) {
    const contract = await this.getById(contractId);

    // Vérifier que l'utilisateur est l'expert
    if (data.signedBy !== contract.accountant_id) {
      throw new CustomError('Unauthorized', 403, 'UNAUTHORIZED');
    }

    if (contract.status !== 'pending' && contract.status !== 'draft') {
      throw new CustomError(
        `Contract is ${contract.status}, cannot sign`,
        400,
        'INVALID_STATUS'
      );
    }

    const updated = await prisma.contracts.update({
      where: { id: contractId },
      data: {
        status: 'signed',
        accountant_signed_at: new Date(),
        accountant_signature: data.signature,
        accountant_signed_by: data.signedBy,
        updated_at: new Date(),
      },
    });
    // The original code had this conditional logic, but the diff replaces it.
    // status: contract.companySignedAt ? 'signed' : 'pending',
    // signedAt: contract.companySignedAt ? new Date() : undefined,
    // },
    // });

    logger.info(`Contract signed by accountant: ${contractId}`, {
      accountantId: contract.accountant_id,
      signedBy: data.signedBy,
    });

    // TODO: Envoyer notification à l'entreprise si les deux parties ont signé

    return updated;
  }

  /**
   * Annuler un contrat
   */
  async cancel(contractId: string, cancelledBy: string, companyId?: string, accountantId?: string) {
    const contract = await this.getById(contractId, companyId, accountantId);

    // Vérifier les permissions
    if (companyId && contract.companyId !== companyId) {
      throw new CustomError('Unauthorized', 403, 'UNAUTHORIZED');
    }
    if (accountantId && contract.accountantId !== accountantId) {
      throw new CustomError('Unauthorized', 403, 'UNAUTHORIZED');
    }

    if (contract.status === 'signed') {
      throw new CustomError(
        'Cannot cancel signed contract',
        400,
        'CONTRACT_SIGNED'
      );
    }

    const updated = await prisma.contract.update({
      where: { id: contractId },
      data: {
        status: 'cancelled',
      },
    });

    logger.info(`Contract cancelled: ${contractId}`, {
      cancelledBy,
      companyId: contract.companyId,
      accountantId: contract.accountantId,
    });

    return updated;
  }

  /**
   * Obtenir les templates de contrats disponibles
   */
  async getTemplates() {
    // Pour l'instant, retourner des templates statiques
    // Plus tard, on pourra les stocker en base de données
    return [
      {
        id: 'template-accountant-service',
        name: 'Contrat de Prestation Comptable Standard',
        description: 'Contrat standard pour les services comptables',
        content: `
# Contrat de Prestation Comptable

Entre les soussignés :

**L'Entreprise :** {{company.name}}
**L'Expert Comptable :** {{accountant.name}}

## Objet
Le présent contrat a pour objet la prestation de services comptables...

## Durée
Du {{startDate}} au {{endDate}}

## Honoraires
Les honoraires sont fixés à {{fees}} CDF par mois.

## Signature
Fait en double exemplaire à {{city}}, le {{date}}.

Signature Entreprise          Signature Expert Comptable
        `,
      },
      {
        id: 'template-confidentiality',
        name: 'Accord de Confidentialité',
        description: 'Accord de confidentialité entre entreprise et expert',
        content: `
# Accord de Confidentialité

Entre {{company.name}} et {{accountant.name}}...

## Engagements
Les parties s'engagent à maintenir la confidentialité...
        `,
      },
    ];
  }
}

export default new ContractService();

