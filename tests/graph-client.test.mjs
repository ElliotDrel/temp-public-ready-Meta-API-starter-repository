import test from 'node:test';
import assert from 'node:assert/strict';
import { InstagramGraphClient, GraphApiError, retryDelayMs } from '../src/graph-client.mjs';

test('never includes bearer in URL, sends correct form fields', async () => {
  const captures = [];
  const client = new InstagramGraphClient({ token:'TEST_SECRET_TOKEN', igUserId:'12345',
    fetchImpl: async (url, init)=>{captures.push({url:String(url), init}); return {
      ok:true, status:200, text:async()=>'{"id":"container_1"}', headers: new Headers(),
    };} });
  const result = await client.createImageContainer('https://example.org/a.png', 'Hello');
  assert.equal(result.id, 'container_1');
  assert.equal(captures[0].url, 'https://graph.instagram.com/v25.0/12345/media');
  assert.equal(captures[0].init.headers.authorization, 'Bearer TEST_SECRET_TOKEN');
  assert.ok(!captures[0].url.includes('TEST_SECRET_TOKEN'));
  assert.ok(captures[0].init.body.includes('image_url=https%3A%2F%2Fexample.org%2Fa.png'));
});
test('no retries on bad parameters but retries 429', async () => {
  assert.equal(retryDelayMs(new GraphApiError('bad',{status:400}), 0), null);
  assert.equal(retryDelayMs(new GraphApiError('busy',{status:429,retryAfter:'2'}), 0), 2000);
  let count=0;
  const client = new InstagramGraphClient({token:'token',igUserId:'123',sleep:async()=>{},
    fetchImpl:async()=>{count++; return count===1 ? {
      ok:false,status:429,headers:new Headers({'retry-after':'0'}),text:async()=>'{"error":{"code":4,"message":"throttled"}}',
    } : {ok:true,status:200,headers:new Headers(),text:async()=>'{"id":"OK"}'};} });
  assert.equal((await client.publishContainer('container')).id,'OK');
  assert.equal(count,2);
});
