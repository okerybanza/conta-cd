export declare class EncryptionService {
    static generateKey(): string;
    encrypt(value: string, key?: string): string;
    decrypt(encryptedValue: string, key?: string): string;
    encryptObject(obj: Record<string, any>, fieldsToEncrypt: string[], key?: string): Record<string, any>;
    decryptObject(obj: Record<string, any>, fieldsToDecrypt: string[], key?: string): Record<string, any>;
    isEncrypted(value: string): boolean;
    hash(value: string): string;
}
declare const _default: EncryptionService;
export default _default;
//# sourceMappingURL=encryption.service.d.ts.map