import { createHmac, timingSafeEqual } from 'node:crypto';

/** Verify against the ORIGINAL raw bytes; do not JSON.parse / stringify first. */
export function verifyMetaSignature(rawBody, signatureHeader, appSecret) {
  if (!appSecret || !signatureHeader || !/^sha256=[0-9a-f]{64}$/i.test(signatureHeader)) return false;
  const expected = 'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const actualBytes = Buffer.from(signatureHeader.toLowerCase(), 'utf8');
  const expectedBytes = Buffer.from(expected, 'utf8');
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}
export function verifyChallenge(urlString, expectedToken) {
  const url = new URL(urlString);
  if (!expectedToken || url.searchParams.get('hub.mode') !== 'subscribe' ||
      url.searchParams.get('hub.verify_token') !== expectedToken) return null;
  return url.searchParams.get('hub.challenge');
}
