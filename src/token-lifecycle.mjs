/** Reference helpers for Instagram Login long-lived token exchange and refresh.
 * Secret and token are included in the official endpoint's query parameters.
 * Never print these URLs or capture them in analytics/proxy access logs.
 */
function assertText(value, name) { if (!value) throw new Error(`Missing ${name}`); }
async function tokenGet(endpoint, fields, fetchImpl = fetch) {
  const url = new URL(`https://graph.instagram.com/${endpoint}`);
  Object.entries(fields).forEach(([key, value]) => url.searchParams.set(key, value));
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(20_000), cache: 'no-store' });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(`Instagram credential exchange failed (HTTP ${res.status})`);
  if (!body.access_token) throw new Error('Token response missing access_token');
  return { accessToken: body.access_token, expiresIn: body.expires_in ?? null, tokenType: body.token_type ?? null };
}
export async function exchangeLongLivedToken({ shortLivedToken, appSecret, fetchImpl }) {
  assertText(shortLivedToken, 'short-lived token');
  assertText(appSecret, 'Instagram app secret');
  return tokenGet('access_token', {
    grant_type: 'ig_exchange_token', client_secret: appSecret, access_token: shortLivedToken,
  }, fetchImpl);
}
export async function refreshLongLivedToken({ accessToken, fetchImpl }) {
  assertText(accessToken, 'Instagram access token');
  return tokenGet('refresh_access_token', {
    grant_type: 'ig_refresh_token', access_token: accessToken,
  }, fetchImpl);
}
export function needsRefresh({ expiresAt, now = new Date(), bufferDays = 14 }) {
  const deadline = new Date(expiresAt).getTime();
  if (!Number.isFinite(deadline)) throw new Error('Valid expiresAt required');
  return deadline - now.getTime() <= bufferDays * 86_400_000;
}
// Production implementation: serialize refresh per account, rotate in a secret store,
// persist expiresAt atomically, and mark revoked credentials for reauthorization.
// Meta long-lived IG tokens must be valid and at least 24 hours old to refresh.
