# Hard-won integration lessons (distilled from the buildpurdue implementation)

These are **design lessons**, not guarantees that every API field is valid for every Meta app or release. Verify against your own account and current docs.

## 1. The read path and the publish path are different

buildpurdue's Instagram Graph code currently lists media, replies to comments, sends private replies, archives insights, and responds to webhooks. Its Instagram marketing workflow opens the Instagram composer, copies captions, and records the live post URL. **It does not currently issue `/{ig-user-id}/media_publish`.** The publishing example in this kit is newly authored guidance rather than extracted working buildpurdue publishing code.

## 2. Webhook self-replies can loop forever

Your own public reply becomes a new comment event. Skip events where the author is your IG account, and skip nested replies (`parent_id`). Keep the match rule scoped to numeric media IDs. Do not confuse `/p/SHORTCODE` with the webhook's numeric `ig_media_id`.

## 3. Meta retries webhooks aggressively

Acknowledge immediately after signature verification and durable queue insertion. In a fast edge runtime, `waitUntil` can dispatch afterward, but **durable enqueue before 200 is safer** when a process crashes. Unique event IDs and `(event_id, action_type)` keep retries/concurrent deliveries from double-sending.

## 4. Button messages can appear to work but drop the button

The Meta button template accepts up to 640 characters in template text and 20 characters in the button title. The API may acknowledge a send but omit the oversize button. Always validate before send. If copy exceeds button limits, send plain text and append the URL so the recipient receives it. A link in template text is not a substitute for a clickable button.

## 5. Private replies have a narrow window

The comment-triggered private reply mechanism is not an unrestricted cold-DM capability. It is limited to one private reply per eligible comment, with a time window (observed seven days for the buildpurdue workflow). Never treat a 4xx response as transient; expired windows and missing permissions will not improve with retries.

## 6. Identical public replies can be suppressed

Meta may suppress repeated identical replies under one post. Rotate through a small set of approved replies using a **stable hash of the comment ID**, not randomness. A retry of the same comment then chooses the same text.

## 7. Retry only what can recover

Retry 429, recognized Meta throttle error codes (`4`, `17`, `32`, `613`), and 5xx/network issues using a capped backoff and `Retry-After`. Auth/revocation, a malformed media container, and unsupported metrics are usually permanent until fixed. Never include bearer tokens or `access_token` query strings in logs.

## 8. A batch insights request fails as a unit

One unsupported media insight metric can cause the entire `/{media-id}/insights?metric=a,b,c` call to 400. Falling back to one request per metric for **every** post can multiply calls and hit an edge worker's wall clock. Keep a stable batch of verified common metrics; probe optional metrics only for a bounded number of newest posts.

## 9. Account insights have TWO incompatible daily shapes

`reach` uses a daily series; `views` and many other account metrics may only be served as `metric_type=total_value` for the whole `since`/`until` window. For day-by-day storage, request a **separate one-day window** for total-value metrics. For follower totals, do not misinterpret `follower_count` as the running count; store profile snapshots separately.

## 10. Sync needs more than a daily cron

Backfill late corrections for the most recent settled days, store raw JSON for future reprocessing, and keep hourly snapshots for recent media or active stories. Skip already-complete daily rows to avoid timeouts. Refresh access tokens on a secure worker and store rotated tokens in Vault.

## 11. Instagram CDN thumbnails expire

Do not assume a media CDN thumbnail URL is permanent. Signed media links can expire. Archive durable metadata; refresh or safely proxy thumbnails where appropriate and permitted.

## 12. Metadata and identifiers must be verified live

A new post may exist before a periodic analytics sync adds it. For a UI that registers comment automation, query `GET /{ig-user-id}/media` live; use an archived result only as a fallback.

## 13. The API may not support the full Instagram composer

The original social posting UI makes a human confirm media attachments, collaborator tagging, link tracking, and post URLs. Some native Instagram surfaces require in-app actions. Build a manual fallback rather than promising exact feature parity from a bare API post.

## 14. One API may require multiple app secrets

The original app's comment and story webhooks were configured for separate Meta app products and secrets. Never assume webhook signatures for every subscription can use one shared value. Document the app ID, webhook subscription, account ID, login mode, and exact secret each endpoint expects.

## 15. `story_insights` webhooks deserve extra scrutiny

The original app contains a story-insights webhook implementation. **Availability differs by app product/login mode and may not be available on pure Instagram Login.** Verify official event support in your own Meta app before designing a system that depends exclusively on it. Polling active stories while they are available may be needed as a fallback.
