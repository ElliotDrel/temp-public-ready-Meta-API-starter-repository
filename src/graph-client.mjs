/** Instagram Login API helper. Auth is server-side and token never appears in logs. */
export class GraphApiError extends Error {
  constructor(message, { status = 0, code = null, subcode = null, retryAfter = null, path = '' } = {}) {
    super(message);
    this.name = 'GraphApiError';
    Object.assign(this, { status, code, subcode, retryAfter, path });
  }
}

const RETRYABLE_META_CODES = new Set([4, 17, 32, 613]);
export function retryDelayMs(error, attempt, maxAttempts = 3) {
  if (attempt >= maxAttempts - 1) return null;
  const transient = error.status === 429 || error.status >= 500 || error.status === 0 || RETRYABLE_META_CODES.has(error.code);
  if (!transient) return null;
  const headerSeconds = Number(error.retryAfter);
  const delay = error.retryAfter != null && Number.isFinite(headerSeconds) && headerSeconds >= 0
    ? headerSeconds * 1000 : 1000 * 2 ** attempt;
  return Math.min(delay, 15_000);
}

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export class InstagramGraphClient {
  constructor({ token, igUserId, version = 'v25.0', fetchImpl = fetch, sleep = pause, maxAttempts = 3 }) {
    if (!token || !igUserId) throw new Error('Instagram token and IG professional user ID are required');
    if (!/^v\d+\.\d+$/.test(version)) throw new Error('Invalid Graph version');
    this.token = token;
    this.igUserId = String(igUserId);
    this.version = version;
    this.fetch = fetchImpl;
    this.sleep = sleep;
    this.maxAttempts = maxAttempts;
    this.base = `https://graph.instagram.com/${version}`;
  }

  async request(method, path, params = {}) {
    if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
      throw new Error('Graph path must be relative and begin with one /');
    }
    const url = new URL(this.base + path);
    const values = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) values.set(key, String(value));
    }
    if (method === 'GET') url.search = values.toString();
    for (let attempt = 0; attempt < this.maxAttempts; attempt += 1) {
      let problem;
      try {
        const res = await this.fetch(url, {
          method,
          headers: {
            authorization: `Bearer ${this.token}`,
            ...(method === 'POST' ? { 'content-type': 'application/x-www-form-urlencoded' } : {}),
          },
          ...(method === 'POST' ? { body: values.toString() } : {}),
          signal: AbortSignal.timeout(20_000),
        });
        const bodyText = await res.text();
        let data;
        try { data = JSON.parse(bodyText); } catch { data = {}; }
        if (res.ok && !data.error) return data;
        problem = new GraphApiError(data.error?.message ?? `Instagram HTTP ${res.status}`, {
          status: res.status,
          code: data.error?.code ?? null,
          subcode: data.error?.error_subcode ?? null,
          retryAfter: res.headers.get('retry-after'),
          path, // No credential or query string ever included in this error.
        });
      } catch (e) {
        problem = e instanceof GraphApiError ? e : new GraphApiError('Instagram network/timeout error', { path });
      }
      const delay = retryDelayMs(problem, attempt, this.maxAttempts);
      if (delay === null) throw problem;
      await this.sleep(delay);
    }
    throw new GraphApiError('Retry budget exhausted', { path });
  }

  get(path, fields = {}) { return this.request('GET', path, fields); }
  post(path, fields = {}) { return this.request('POST', path, fields); }

  profile() { return this.get(`/${this.igUserId}`, { fields: 'id,username,account_type,followers_count,media_count' }); }
  recentMedia(limit = 25) {
    return this.get(`/${this.igUserId}/media`, {
      fields: 'id,caption,media_type,media_product_type,permalink,timestamp,thumbnail_url,media_url',
      limit: Math.min(Math.max(1, limit), 100),
    });
  }
  // Meta must be able to fetch imageUrl over public HTTPS.
  createImageContainer(imageUrl, caption, extra = {}) {
    return this.post(`/${this.igUserId}/media`, { image_url: imageUrl, caption, ...extra });
  }
  // Processing videos is asynchronous; poll status before publishing.
  createReelContainer(videoUrl, caption, extra = {}) {
    return this.post(`/${this.igUserId}/media`, { media_type: 'REELS', video_url: videoUrl, caption, ...extra });
  }
  // For carousels, create each child with is_carousel_item=true before parent.
  createCarouselContainer(childIds, caption, extra = {}) {
    return this.post(`/${this.igUserId}/media`, {
      media_type: 'CAROUSEL', children: childIds.join(','), caption, ...extra,
    });
  }
  containerStatus(containerId) { return this.get(`/${containerId}`, { fields: 'id,status_code,status' }); }
  publishingLimit() { return this.get(`/${this.igUserId}/content_publishing_limit`); }
  publishContainer(containerId) { return this.post(`/${this.igUserId}/media_publish`, { creation_id: containerId }); }
  publicReply(commentId, message) { return this.post(`/${commentId}/replies`, { message }); }
  privateReply(commentId, payload) {
    // Instagram Messaging API private reply addresses the COMMENT, not a user ID.
    return this.post(`/${this.igUserId}/messages`, {
      recipient: JSON.stringify({ comment_id: commentId }), message: JSON.stringify(payload),
    });
  }
  mediaInsights(mediaId, metrics) {
    return this.get(`/${mediaId}/insights`, { metric: metrics.join(',') });
  }
  accountInsights(params) { return this.get(`/${this.igUserId}/insights`, params); }
}
