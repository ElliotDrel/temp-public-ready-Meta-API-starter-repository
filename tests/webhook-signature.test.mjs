import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifyMetaSignature, verifyChallenge } from '../src/webhook-signature.mjs';
import { onWebhookRequest } from '../examples/webhook-handler.mjs';

test('accepts valid raw payload but rejects changed payload and missing secret', () => {
  const raw = Buffer.from('{"entry":[],"object":"instagram"}');
  const sig = 'sha256=' + createHmac('sha256','secret').update(raw).digest('hex');
  assert.equal(verifyMetaSignature(raw, sig, 'secret'), true);
  assert.equal(verifyMetaSignature(Buffer.from('{"entry":[], "object":"instagram"}'), sig, 'secret'), false);
  assert.equal(verifyMetaSignature(raw, sig, ''), false);
  assert.equal(verifyMetaSignature(raw, 'sha256=fake', 'secret'), false);
});
test('validates challenge token and mode', () => {
  const url = 'https://example.org?hub.mode=subscribe&hub.verify_token=check&hub.challenge=321';
  assert.equal(verifyChallenge(url, 'check'), '321');
  assert.equal(verifyChallenge(url, 'wrong'), null);
});
test('persists event before webhook acknowledge', async () => {
  const raw = Buffer.from(JSON.stringify({ object: 'instagram', entry: [{ changes: [
    { field: 'comments', value: { id:'123', text:'guide', from:{id:'other'} } },
  ] }] }));
  const sig = 'sha256='+createHmac('sha256','key').update(raw).digest('hex');
  const events=[];
  const result = await onWebhookRequest({ rawBodyBytes:raw, headers:{'x-hub-signature-256':sig},
    env:{INSTAGRAM_APP_SECRET:'key'},enqueueUnique:async(event)=>{events.push(event);} });
  assert.equal(result.status,200);
  assert.equal(events.length,1);
  assert.equal(events[0].key,'instagram-comment:123');
});
