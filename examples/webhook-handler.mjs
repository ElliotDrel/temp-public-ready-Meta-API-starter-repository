/**
 * Framework-agnostic sketch. Adapt to Deno/Supabase or Next.js, with original
 * raw bytes and a DURABLE queue. This is not an HTTP server by itself.
 */
import { verifyChallenge, verifyMetaSignature } from '../src/webhook-signature.mjs';

export async function onVerifyRequest(url, env) {
  const challenge = verifyChallenge(url, env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN);
  return challenge === null ? { status: 403, body: 'Forbidden' } : { status: 200, body: challenge };
}
export async function onWebhookRequest({ rawBodyBytes, headers, env, enqueueUnique }) {
  if (!env.INSTAGRAM_APP_SECRET) return { status: 500, body: 'Missing server configuration' };
  if (!verifyMetaSignature(rawBodyBytes, headers['x-hub-signature-256'], env.INSTAGRAM_APP_SECRET)) {
    return { status: 401, body: 'Bad signature' };
  }
  let payload;
  try { payload = JSON.parse(Buffer.from(rawBodyBytes).toString('utf8')); }
  catch { return { status: 400, body: 'Malformed JSON' }; }
  if (payload.object !== 'instagram') return { status: 200, body: 'ignored' };
  // Durable enqueueUnique transaction must commit BEFORE returning HTTP 200.
  // Unique index should cover event ID + eventual action type. No Graph API calls here.
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'comments') continue;
      const commentId = change.value?.id;
      if (!commentId) continue;
      await enqueueUnique({
        key: `instagram-comment:${commentId}`,
        commentId, mediaId: change.value?.media?.id ?? null,
        fromId: change.value?.from?.id ?? null,
        parentId: change.value?.parent_id ?? null,
        text: change.value?.text ?? '',
      });
    }
  }
  return { status: 200, body: 'OK' };
}
