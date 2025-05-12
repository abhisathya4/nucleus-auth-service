import crypto from "crypto";
import env from "../config/env";

const ENCRYPTION_KEY = env.AES_ENCRYPTION_KEY!.substring(0, 32); // Must be 32 bytes for AES-256
const IV_LENGTH = 16; // AES block size

export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY, "utf-8"),
    iv
  );
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted; // Concatenate IV and encrypted token
}

export function decryptToken(encryptedToken: string): string {
  const [ivHex, encrypted] = encryptedToken.split(":");
  const iv = Buffer.from(ivHex!, "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY, "utf-8"),
    iv
  );
  let decrypted = decipher.update(encrypted!, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
