export interface CreateContractData {
    companyId: string;
    accountantId: string;
    type?: string;
    title: string;
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
    signature: string;
    signedBy: string;
}
export interface ContractFilters {
    companyId?: string;
    accountantId?: string;
    status?: string;
    type?: string;
}
export declare class ContractService {
    /**
     * Créer un contrat
     */
    create(data: CreateContractData): Promise<any>;
    /**
     * Obtenir un contrat par ID
     */
    getById(contractId: string, companyId?: string, accountantId?: string): Promise<any>;
    /**
     * Lister les contrats avec filtres
     */
    list(filters?: ContractFilters): Promise<any>;
    /**
     * Mettre à jour un contrat
     */
    update(contractId: string, data: UpdateContractData, companyId?: string, accountantId?: string): Promise<any>;
    /**
     * Signer un contrat (par l'entreprise)
     */
    signByCompany(contractId: string, data: SignContractData): Promise<any>;
    /**
     * Signer un contrat (par l'expert)
     */
    signByAccountant(contractId: string, data: SignContractData): Promise<any>;
    /**
     * Annuler un contrat
     */
    cancel(contractId: string, cancelledBy: string, companyId?: string, accountantId?: string): Promise<any>;
    /**
     * Obtenir les templates de contrats disponibles
     */
    getTemplates(): Promise<{
        id: string;
        name: string;
        description: string;
        content: string;
    }[]>;
}
declare const _default: ContractService;
export default _default;
//# sourceMappingURL=contract.service.d.ts.map