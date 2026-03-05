import crypto from "node:crypto";

type SecretServiceOptions = {
  key: string;
};

const KEY_LENGTH = 32;
const IV_LENGTH = 12;

const toBuffer = (input: string) => Buffer.from(input, "base64");
const toBase64 = (input: Buffer) => input.toString("base64");

const normalizeKey = (key: string) => {
  const raw = Buffer.from(key, "base64");
  if (raw.length !== KEY_LENGTH) {
    throw new Error("InvalidSecretKeyLength");
  }
  return raw;
};

export class SecretService {
  private readonly key: Buffer;

  constructor(options: SecretServiceOptions) {
    this.key = normalizeKey(options.key);
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-gcm", this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [toBase64(iv), toBase64(tag), toBase64(encrypted)].join(".");
  }

  decrypt(payload: string): string {
    const [ivPart, tagPart, dataPart] = payload.split(".");
    if (!ivPart || !tagPart || !dataPart) {
      throw new Error("InvalidSecretPayload");
    }
    const iv = toBuffer(ivPart);
    const tag = toBuffer(tagPart);
    const data = toBuffer(dataPart);
    const decipher = crypto.createDecipheriv("aes-256-gcm", this.key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString("utf8");
  }

  static generateKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString("base64");
  }

  static encryptEnvValue(key: string, value: string): string {
    const service = new SecretService({ key });
    return `ENC:${service.encrypt(value)}`;
  }

  static decryptEnvValue(key: string, payload: string): string {
    if (!payload.startsWith("ENC:")) return payload;
    const service = new SecretService({ key });
    return service.decrypt(payload.slice(4));
  }
}
