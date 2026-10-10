/** Pure scheduling/state helpers. Persistence and locks MUST be provided by your DB. */
export const STATES = Object.freeze({
  DRAFT: 'DRAFT', SCHEDULED: 'SCHEDULED', CLAIMED: 'CLAIMED',
  CONTAINER_CREATED: 'CONTAINER_CREATED', READY: 'READY',
  PUBLISHING: 'PUBLISHING', PUBLISHED: 'PUBLISHED', FAILED: 'FAILED', CANCELLED: 'CANCELLED',
});
const ALLOWED = {
  DRAFT: ['SCHEDULED', 'CANCELLED'], SCHEDULED: ['CLAIMED', 'CANCELLED'],
  CLAIMED: ['CONTAINER_CREATED', 'FAILED', 'CANCELLED'],
  CONTAINER_CREATED: ['READY', 'FAILED'], READY: ['PUBLISHING', 'FAILED'],
  PUBLISHING: ['PUBLISHED', 'FAILED'], FAILED: ['SCHEDULED', 'CANCELLED'],
  PUBLISHED: [], CANCELLED: [],
};
export function transition(current, next) {
  if (!ALLOWED[current]?.includes(next)) throw new Error(`Invalid publish transition: ${current} -> ${next}`);
  return next;
}
export function due(job, now = new Date()) {
  return job.status === STATES.SCHEDULED && new Date(job.scheduledAt).getTime() <= now.getTime();
}
export function canReclaim(job, now = new Date()) {
  return job.status === STATES.CLAIMED && new Date(job.leaseUntil).getTime() < now.getTime();
}
export function shouldRetry(err, attempts, maxAttempts = 3) {
  if (attempts >= maxAttempts) return false;
  return err?.status === 429 || err?.status >= 500 || [4,17,32,613].includes(err?.code);
}
/** A PUBLISHING timeout is ambiguous. Check remote account/container state first.
 * The library intentionally provides NO automatic PUBLISHING -> PUBLISHING replay.
 */
