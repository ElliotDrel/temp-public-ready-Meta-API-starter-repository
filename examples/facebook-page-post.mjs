/**
 * Separate API FAMILY. Facebook Page posting is NOT implemented by buildpurdue.
 * This sketch exists so an agent doesn't accidentally reuse an Instagram token.
 * POST /{page-id}/feed requires a PAGE access token and appropriate Page permissions.
 * No request is made by running this file unless EXECUTE_FB_POST=YES_I_UNDERSTAND.
 */
const execute = process.env.EXECUTE_FB_POST === 'YES_I_UNDERSTAND';
const pageId = process.env.FACEBOOK_PAGE_ID;
const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const message = process.env.FACEBOOK_MESSAGE ?? 'Reference Page post';
if (!execute) {
  console.log('DRY_RUN: POST https://graph.facebook.com/{VERSION}/{PAGE_ID}/feed with a PAGE token and message');
} else {
  if (!pageId || !accessToken) throw new Error('Missing Facebook Page ID or Page access token');
  const version = process.env.FACEBOOK_GRAPH_API_VERSION ?? 'v25.0';
  if (!/^v\d+\.\d+$/.test(version)) throw new Error('Invalid Graph API version');
  const endpoint = `https://graph.facebook.com/${version}/${pageId}/feed`;
  const res = await fetch(endpoint, { method: 'POST', headers: {
    authorization: `Bearer ${accessToken}`,
    'content-type': 'application/x-www-form-urlencoded',
  }, body: new URLSearchParams({ message }) });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(`Facebook Page publish failed (HTTP ${res.status})`);
  console.log(JSON.stringify({ publishedPostId: data.id }));
}
