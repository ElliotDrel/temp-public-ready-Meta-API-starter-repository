# Copy-ready coding-agent brief

**Goal:** Build a durable system where a user authorizes a professional Instagram account, creates or imports a media post, approves it, schedules a publish, and sees the final status and permalink. Optional: comment-triggered DM and historical analytics.

**Treat this starter as reference context only.** Read `AGENTS.md`, `docs/authentication.md`, `docs/architecture.md`, and `docs/lessons-learned.md`; review the code in `src/` before generating a final design. Cross-check current Meta docs for authentication, permissions, scopes, content publishing, media requirements, rate limits, and messaging restrictions. The source of truth is Meta's live documentation.

## Requirements in priority order

1. OAuth with Instagram Login, secure CSRF state, token exchange, token refresh, reconnect/revoke state, encrypted token storage, account ownership, minimal scopes. No login token exposed to client.
2. Upload/host public media URL; validate image/video encoding, dimensions, size, URL accessibility. Draft editor and explicit approve step.
3. Postgres data model and migrations: user/account, credential reference, draft, media, scheduled publish, events, attempts, idempotency keys and audited state changes. Enforce owner authorization.
4. Durable scheduler that polls UTC due time, claims jobs atomically, and can handle restarts, cancellations, and duplicate schedule requests.
5. Container creation, status polling for asynchronous video, publish call, and persistent remote IDs. Distinguish permanent vs retryable errors.
6. On publish timeout: reconcile unknown outcome instead of blindly repeating irreversible publish. Expose review state and alert operator.
7. Admin UI: account status, preview, scheduled queue, published history, human-readable error messages, pause/cancel/retry with guardrails.
8. Webhooks: signed raw-body receiver, durable de-dup queue, fast ACK. Optional rules with validated keywords, content and templates, action uniqueness, and safe DMs.
9. Metrics: minimally media list and insights sync with bounded backfill; optional longer-term archive, raw JSON storage, retention awareness.
10. CI, tests, staging app credentials, documentation, observability, security review.

## Negative tests that must pass

- Repeated approve click creates exactly one scheduled publish for same idempotency key.
- Two workers cannot claim the same job at the same time.
- Crash between `media_publish` request and response does not automatically double-post.
- Revoked token pauses future jobs and prompts for reconnect.
- Webhook wrong/missing signature is rejected before DB write.
- Webhook duplicate and duplicate `(eventId, actionType)` don't double-reply/DM.
- Comment sent by own IG account and child thread replies are ignored.
- A long DM button message falls back to plain text with link.
- Unsupported insights metric does not cause unbounded per-post fallback.
- A non-owner cannot publish from another linked account.
- Tests never send live posts without explicit human-armed integration environment.

## Deliverables

Design doc, implementation with storage + runtime wiring, migration, API endpoints, UI, tests, runbook, threat model, Meta app setup checklist, integration test record. This starter **does not** provide the runtime integration, so avoid claiming a working system just because the pure helper tests pass.
