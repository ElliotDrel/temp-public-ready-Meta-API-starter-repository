/** Observed patterns from an Instagram Login analytics archive; API fields vary. */
export const MEDIA_COMMON = ['reach', 'likes', 'comments', 'shares', 'saved', 'total_interactions', 'views'];
export const MEDIA_REELS = [...MEDIA_COMMON, 'ig_reels_avg_watch_time', 'ig_reels_video_view_total_time', 'reels_skip_rate'];
export const MEDIA_STORIES = ['reach', 'likes', 'comments', 'replies', 'shares', 'saved', 'total_interactions', 'views'];
export const MEDIA_OPTIONAL_PROBE = ['profile_visits','follows','reposts','facebook_views','crossposted_views'];
export const ACCOUNT_TIMESERIES = ['reach'];
export const ACCOUNT_DAILY_TOTALS = ['views','accounts_engaged','total_interactions','likes','comments',
  'shares','saves','replies','follows_and_unfollows','profile_links_taps'];
export function isoDayStart(date) { return new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate())); }
export function oneDayWindows(endExclusive, days) {
  const end = isoDayStart(new Date(endExclusive));
  return Array.from({length: days}, (_, i) => {
    const start = new Date(end.getTime() - (days - i) * 86400000);
    return { since: Math.floor(start.getTime()/1000), until: Math.floor((start.getTime()+86400000)/1000) };
  });
}
export function mergeDailyMetrics(existing = {}, incoming = {}) { return { ...existing, ...incoming }; }
export function uniqueRawEntries(existing = [], incoming = []) {
  const entries = new Map();
  for (const item of [...existing,...incoming]) {
    entries.set(JSON.stringify([item?.name,item?.period,item?.since,item?.until,item?.title]), item);
  }
  return [...entries.values()];
}
