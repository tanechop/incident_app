import crypto from 'crypto'

// Encrypts small secrets (the Gemini key) before they are stored in the database.
// AES-256-GCM; the key is derived from a server secret, so the database alone is not enough to read them.
export function createVault(secret) {
  const key = crypto.createHash('sha256').update(String(secret)).digest()

  return {
    encrypt(text) {
      const iv = crypto.randomBytes(12)
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
      const data = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()])
      return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64')
    },
    // Returns null if the value was changed or was encrypted with another secret
    decrypt(value) {
      try {
        const buf = Buffer.from(String(value), 'base64')
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, buf.subarray(0, 12))
        decipher.setAuthTag(buf.subarray(12, 28))
        return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8')
      } catch {
        return null
      }
    },
  }
}
