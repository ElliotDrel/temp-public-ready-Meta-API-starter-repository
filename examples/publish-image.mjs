/**
 * REFERENCE ONLY. Dry-run by default: will not publish unless explicitly armed.
 * Usage:
 *   IMAGE_URL=https://public.example/image.jpg CAPTION='Example' node examples/publish-image.mjs
 * To actually publish, read docs/authentication.md, supply credentials and
 * EXECUTE_LIVE_PUBLISH=YES_I_UNDERSTAND (publishes a real post; no sandbox).
 */
import { InstagramGraphClient } from '../src/graph-client.mjs';

const url = process.env.IMAGE_URL ?? 'https://public.example/image.jpg';
const caption = process.env.CAPTION ?? 'Reference image post';
const armed = process.env.EXECUTE_LIVE_PUBLISH === 'YES_I_UNDERSTAND';
if (!armed) {
  console.log(JSON.stringify({ mode: 'DRY_RUN', steps: [
    { method: 'POST', endpoint: '/{ig-user-id}/media', fields: { image_url: url, caption } },
    { method: 'GET', endpoint: '/{container-id}?fields=status_code' },
    { method: 'POST', endpoint: '/{ig-user-id}/media_publish', fields: { creation_id: '{container-id}' } },
  ], notes: ['Meta must be able to fetch the image from HTTPS', 'No post was published'] }, null, 2));
  process.exit(0);
}

const client = new InstagramGraphClient({
  token: process.env.INSTAGRAM_ACCESS_TOKEN,
  igUserId: process.env.INSTAGRAM_USER_ID,
  version: process.env.INSTAGRAM_GRAPH_API_VERSION || 'v25.0',
});
if (!url.startsWith('https://') || url.includes('public.example')) throw new Error('Use a real publicly accessible HTTPS image URL');
const container = await client.createImageContainer(url, caption);
if (!container.id) throw new Error('Meta did not return a container ID');
const status = await client.containerStatus(container.id);
if (status.status_code === 'ERROR' || status.status_code === 'EXPIRED') {
  throw new Error(`Container not publishable: ${status.status_code}`);
}
// A robust real worker should poll PENDING/IN_PROGRESS, store state durably,
// and verify limits. This example refuses unknown statuses rather than guessing.
if (status.status_code !== 'FINISHED') throw new Error(`Container not ready: ${status.status_code}`);
const published = await client.publishContainer(container.id);
console.log(JSON.stringify({ publishedMediaId: published.id, containerId: container.id }));
