import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto'

export interface EncryptedData {
  encrypted: string
  iv: string
  salt: string
}

export class DataEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm'
  private static readonly KEY_LENGTH = 32
  private static readonly IV_LENGTH = 16
  private static readonly SALT_LENGTH = 64
  private static readonly TAG_LENGTH = 16

  /**
   * Encrypt sensitive data
   */
  static async encrypt(data: string, masterKey: string): Promise<EncryptedData> {
    try {
      // Generate a random salt and IV
      const salt = randomBytes(this.SALT_LENGTH)
      const iv = randomBytes(this.IV_LENGTH)

      // Derive encryption key from master key and salt
      const key = await this.deriveKey(masterKey, salt)

      // Create cipher and encrypt data
      const cipher = createCipheriv(this.ALGORITHM, key, iv)
      
      let encrypted = cipher.update(data, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      // Get authentication tag
      const tag = cipher.getAuthTag()

      // Combine encrypted data with tag
      const encryptedWithTag = encrypted + tag.toString('hex')

      return {
        encrypted: encryptedWithTag,
        iv: iv.toString('hex'),
        salt: salt.toString('hex')
      }
    } catch (error) {
      throw new Error(`Encryption failed: ${error}`)
    }
  }

  /**
   * Decrypt encrypted data
   */
  static async decrypt(encryptedData: EncryptedData, masterKey: string): Promise<string> {
    try {
      // Parse the encrypted data components
      const { encrypted, iv, salt } = encryptedData
      
      // Convert hex strings back to buffers
      const ivBuffer = Buffer.from(iv, 'hex')
      const saltBuffer = Buffer.from(salt, 'hex')
      
      // Extract the tag from the encrypted data
      const tag = Buffer.from(encrypted.slice(-this.TAG_LENGTH * 2), 'hex')
      const encryptedWithoutTag = encrypted.slice(0, -this.TAG_LENGTH * 2)

      // Derive the same key
      const key = await this.deriveKey(masterKey, saltBuffer)

      // Create decipher and decrypt
      const decipher = createDecipheriv(this.ALGORITHM, key, ivBuffer)
      decipher.setAuthTag(tag)

      let decrypted = decipher.update(encryptedWithoutTag, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`)
    }
  }

    /**
   * Encrypt an object
   */
  static async encryptObject<T extends Record<string, any>>(
    obj: T,
    masterKey: string,
    fieldsToEncrypt: (keyof T)[]
  ): Promise<T> {
    const encryptedObj = { ...obj } as T

    for (const field of fieldsToEncrypt) {
      if (obj[field] !== undefined && obj[field] !== null) {
        const encrypted = await this.encrypt(String(obj[field]), masterKey)
        ;(encryptedObj as any)[field] = JSON.stringify(encrypted)
      }
    }

    return encryptedObj
  }

  /**
   * Decrypt an object
   */
  static async decryptObject<T extends Record<string, any>>(
    obj: T,
    masterKey: string,
    fieldsToDecrypt: (keyof T)[]
  ): Promise<T> {
    const decryptedObj = { ...obj } as T

    for (const field of fieldsToDecrypt) {
      if (obj[field] !== undefined && obj[field] !== null) {
        try {
          const encryptedData = JSON.parse(String(obj[field])) as EncryptedData
          const decrypted = await this.decrypt(encryptedData, masterKey)
          ;(decryptedObj as any)[field] = decrypted
        } catch (error) {
          // If decryption fails, keep the original value
          console.warn(`Failed to decrypt field ${String(field)}:`, error)
        }
      }
    }

    return decryptedObj
  }

  /**
   * Encrypt sensitive subscription data
   */
  static async encryptSubscriptionData(subscription: any, masterKey: string): Promise<any> {
    const sensitiveFields = ['notes', 'cancellationInstructions', 'description']
    return this.encryptObject(subscription, masterKey, sensitiveFields)
  }

  /**
   * Decrypt sensitive subscription data
   */
  static async decryptSubscriptionData(subscription: any, masterKey: string): Promise<any> {
    const sensitiveFields = ['notes', 'cancellationInstructions', 'description']
    return this.decryptObject(subscription, masterKey, sensitiveFields)
  }

  /**
   * Encrypt user settings
   */
  static async encryptUserSettings(settings: any, masterKey: string): Promise<any> {
    const sensitiveFields = ['integrations', 'privacy']
    return this.encryptObject(settings, masterKey, sensitiveFields)
  }

  /**
   * Decrypt user settings
   */
  static async decryptUserSettings(settings: any, masterKey: string): Promise<any> {
    const sensitiveFields = ['integrations', 'privacy']
    return this.decryptObject(settings, masterKey, sensitiveFields)
  }

  /**
   * Generate a secure encryption key
   */
  static generateSecureKey(): string {
    return randomBytes(this.KEY_LENGTH).toString('hex')
  }

  /**
   * Hash a password for storage
   */
  static async hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const salt = randomBytes(16).toString('hex')
      
      scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err)
        resolve(salt + ':' + derivedKey.toString('hex'))
      })
    })
  }

  /**
   * Verify a password against its hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const [salt, key] = hash.split(':')
      const keyBuffer = Buffer.from(key, 'hex')
      
      scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err)
        resolve(keyBuffer.equals(derivedKey))
      })
    })
  }

  /**
   * Check if data is encrypted
   */
  static isEncrypted(data: string): boolean {
    try {
      const parsed = JSON.parse(data)
      return parsed.encrypted && parsed.iv && parsed.salt
    } catch {
      return false
    }
  }

  /**
   * Rotate encryption keys (for security updates)
   */
  static async rotateKeys(
    oldMasterKey: string,
    newMasterKey: string,
    encryptedData: EncryptedData
  ): Promise<EncryptedData> {
    // Decrypt with old key
    const decrypted = await this.decrypt(encryptedData, oldMasterKey)
    
    // Re-encrypt with new key
    return this.encrypt(decrypted, newMasterKey)
  }

  private static deriveKey(masterKey: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      scrypt(masterKey, salt, this.KEY_LENGTH, (err, derivedKey) => {
        if (err) reject(err)
        resolve(derivedKey)
      })
    })
  }
}

// Utility functions for common encryption tasks
export const encrypt = {
  subscription: (data: any, masterKey: string) => 
    DataEncryption.encryptSubscriptionData(data, masterKey),
  
  settings: (data: any, masterKey: string) => 
    DataEncryption.encryptUserSettings(data, masterKey),
  
  field: (value: string, masterKey: string) => 
    DataEncryption.encrypt(value, masterKey),
  
  object: <T extends Record<string, any>>(
    obj: T, 
    masterKey: string, 
    fields: (keyof T)[]
  ) => DataEncryption.encryptObject(obj, masterKey, fields)
}

export const decrypt = {
  subscription: (data: any, masterKey: string) => 
    DataEncryption.decryptSubscriptionData(data, masterKey),
  
  settings: (data: any, masterKey: string) => 
    DataEncryption.decryptUserSettings(data, masterKey),
  
  field: (encryptedData: EncryptedData, masterKey: string) => 
    DataEncryption.decrypt(encryptedData, masterKey),
  
  object: <T extends Record<string, any>>(
    obj: T, 
    masterKey: string, 
    fields: (keyof T)[]
  ) => DataEncryption.decryptObject(obj, masterKey, fields)
}

export const security = {
  generateKey: () => DataEncryption.generateSecureKey(),
  hashPassword: (password: string) => DataEncryption.hashPassword(password),
  verifyPassword: (password: string, hash: string) => DataEncryption.verifyPassword(password, hash),
  isEncrypted: (data: string) => DataEncryption.isEncrypted(data),
  rotateKeys: (oldKey: string, newKey: string, data: EncryptedData) => 
    DataEncryption.rotateKeys(oldKey, newKey, data)
}
