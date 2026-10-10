import { randomBytes } from 'node:crypto';

const AUTHORIZE = 'https://www.instagram.com/oauth/authorize';
const TOKEN = 'https://api.instagram.com/oauth/access_token';
// Minimal default. Request optional comment/insight/message scopes only for enabled features.
export const IG_SCOPES = [
  'instagram_business_basic',
  'instagram_business_content_publish',
];
export function newOAuthState() { return randomBytes(24).toString('base64url'); }
export function authorizeUrl({ appId, redirectUri, state, scopes = IG_SCOPES }) {
  if (!appId || !redirectUri || !state) throw new Error('appId, redirectUri and state required');
  const url = new URL(AUTHORIZE);
  url.searchParams.set('client_id', appId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scopes.join(','));
  url.searchParams.set('state', state);
  url.searchParams.set('enable_fb_login', '0'); // Instagram Login only; verify for your app settings.
  return url.toString();
}
export async function exchangeCode({ appId, appSecret, redirectUri, code, fetchImpl = fetch }) {
  if (![appId, appSecret, redirectUri, code].every(Boolean)) throw new Error('OAuth inputs required');
  const body = new URLSearchParams({ client_id: appId, client_secret: appSecret,
    grant_type: 'authorization_code', redirect_uri: redirectUri, code });
  const res = await fetchImpl(TOKEN, { method: 'POST', body });
  const data = await res.json();
  if (!res.ok || !data.access_token) throw new Error(`Instagram code exchange failed (HTTP ${res.status})`);
  return { shortLivedToken: data.access_token, userId: data.user_id };
}
// OAuth callback MUST validate state against a signed, time-limited, single-use
// server-side session, and must never return tokens to the browser.
