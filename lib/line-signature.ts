import { createHmac, timingSafeEqual } from "node:crypto";

export function isValidLineSignature(body: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(body, "utf8").digest();
  let received: Buffer;
  try { received = Buffer.from(signature, "base64"); } catch { return false; }
  return received.length === expected.length && timingSafeEqual(received, expected);
}
