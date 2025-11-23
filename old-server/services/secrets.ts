import crypto from 'crypto';

// Simple in-memory secrets storage (replace with database in production)
const secretsStore = new Map<string, string>();

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY = process.env.SECRET_KEY || crypto.randomBytes(32);
const IV_LENGTH = 16;

export class SecretsService {
  /**
   * Encrypt a plaintext secret
   */
  static encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt an encrypted secret
   */
  static decrypt(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts[0], 'hex');
    const authTag = Buffer.from(textParts[1], 'hex');
    const encryptedText = textParts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Store an encrypted secret
   */
  static storeSecret(key: string, secret: string): void {
    const encrypted = this.encrypt(secret);
    secretsStore.set(key, encrypted);
  }

  /**
   * Retrieve and decrypt a secret
   */
  static getSecret(key: string): string | null {
    const encrypted = secretsStore.get(key);
    if (!encrypted) {
      return null;
    }
    return this.decrypt(encrypted);
  }

  /**
   * Delete a secret
   */
  static deleteSecret(key: string): boolean {
    return secretsStore.delete(key);
  }

  /**
   * Store API key for a provider
   */
  static storeApiKey(providerId: string, apiKey: string): void {
    this.storeSecret(`api_key_${providerId}`, apiKey);
  }

  /**
   * Get API key for a provider
   */
  static getApiKey(providerId: string): string | null {
    return this.getSecret(`api_key_${providerId}`);
  }

  /**
   * Delete API key for a provider
   */
  static deleteApiKey(providerId: string): boolean {
    return this.deleteSecret(`api_key_${providerId}`);
  }
}