# Insights archive notes

The real buildpurdue implementation runs a Supabase Edge Function to collect account/media stats, stores history in Postgres, and refreshes token in Vault. This repo includes only small pure helpers (`src/insights.mjs`) plus this operational outline.

## Collection model

- Media metadata by `ig_media_id`: `caption`, `media_type`, `media_product_type`, `timestamp`, `permalink`, durable ID, raw JSON. Retain raw fields so the parser can change without re-fetching expired API data.
- Account snapshots: daily reach time series, daily total-value metrics obtained from one-day request windows, profile count snapshots, demographics/breakdowns. Keep period and window bounds in the row key.
- Media snapshots: per-media `snapshot_day`, raw metrics, parsed numeric values, and fetch timestamp. Keep last snapshot for each hour for the newest posts, and daily snapshots for older ones.
- Sync runs: `started_at`, `completed_at`, status, response status/error codes, requests made, retry count, and checkpoint. A partial run should be resumable.

## Stable common media batch (observed on the original account)

`reach, likes, comments, shares, saved, total_interactions, views`

Reels may add `ig_reels_avg_watch_time`, `ig_reels_video_view_total_time`, `reels_skip_rate`; stories may add `replies`. Probe other metrics sparingly rather than putting speculative names into the stable batch. Different media products and versions have distinct supported sets.

## Daily total-value problem

For example, asking for `views` with a five-day `since`/`until` can return one aggregate for the entire period, not five daily records. To persist day N's views, request window `[00:00UTC on N, 00:00UTC on N+1)`. In contrast, plain `reach` requests can produce timestamped daily values for the range. See `oneDayWindows` in `src/insights.mjs`.

## Retention strategy

- Hourly recent media refresh: newest ~7 days + stories, cheap only, record current hour.
- Daily full refresh: profile/media list and most recent settled daily metrics. Probe optional metrics only for the 10 newest media. Backfill only missing older windows when budget permits.
- Keep complete raw JSON for audit. Store dimension/breakdown names, timestamps, and numeric units. Avoid `impressions` and `plays` from old tutorials without verifying their deprecation status.
- Respect Meta retention and privacy thresholds; demographic queries can fail due to insufficient cohort size. Avoid alerting on expected privacy threshold errors.

## Performance guardrails

Use fixed request budgets and bounded concurrency, timeouts, exponential backoff for 429/5xx, a single-flight sync lock, and restart checkpoints. One incompatible metric in a batch can balloon request count if blindly retried per metric.
