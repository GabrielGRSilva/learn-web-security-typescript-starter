import { createHmac, timingSafeEqual } from "node:crypto";
import { buffer } from "node:stream/consumers";

const SIGNED_DOWNLOAD_TTL_SECONDS = 5 * 60;

export function createSignedDownloadPath(
  signingKey: Buffer,
  fileId: number,
  nowSeconds: number = currentUnixTime(),
): string {
  const expires = nowSeconds + SIGNED_DOWNLOAD_TTL_SECONDS;
  const signature = signDownload(signingKey, fileId, expires);
  return `/files/${fileId}/signed-download?expires=${expires}&signature=${signature}`;
}

export function verifySignedDownload(
  _signingKey: Buffer,
  _fileId: number,
  expiresValue: string,
  signature: string,
  nowSeconds: number = currentUnixTime(),
): boolean {
  const signatureBuffer = Buffer.from(signature, "hex");
  

  if (!/^\d+$/.test(expiresValue) || !/^[a-f0-9]{64}$/.test(signature)) {
    return false;
  }

  const expires = Number(expiresValue);
  if (!Number.isSafeInteger(expires) || expires <= nowSeconds) {
    return false;
  }

  return true;
}

function signDownload(
  _signingKey: Buffer,
  _fileId: number,
  _expires: number,
): string {
  const hmac = createHmac("sha256", _signingKey);
  hmac.update(`${_fileId}:${_expires}`);
  const signature = hmac.digest("hex");
  return signature;
}

function currentUnixTime(): number {
  return Math.floor(Date.now() / 1000);
}
