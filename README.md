# Meta / Instagram auto-posting starter

A **reference kit for an engineer or coding agent** implementing Instagram publishing, OAuth, webhook automations, scheduling, and historical analytics. Includes realistic but sanitized JavaScript examples, minimal tests, a SQL data-model sketch, and hard-won lessons from the private [buildpurdue monorepo](https://github.com/karthikcsq/buildpurdue-website). **No live account IDs, tokens, webhook URLs, production data, or customer data are included.** The examples are rewritten/adapted from observed implementation patterns and Meta documentation, not verbatim copies of complete private files.

**Status: reference material, not a deployable product.** Several snippets are runnable as local examples; a real app still needs a configured Meta app, OAuth callback, credential vault, durable job runner, storage, rate-limit policies, app review, and production testing. Do not treat this as a working end-to-end system or a substitute for Meta's current docs.

## What is here

| Area | Start reading | What it illustrates |
| --- | --- | --- |
| **Publish Instagram images** | [`examples/publish-image.mjs`](examples/publish-image.mjs), [`src/graph-client.mjs`](src/graph-client.mjs) | Container creation, status checks, publish, public media hosting, bearer-authenticated requests |
| **OAuth + token lifecycle** | [`src/oauth.mjs`](src/oauth.mjs), [`src/token-lifecycle.mjs`](src/token-lifecycle.mjs) | Instagram Login, code exchange, 60-day token exchange/refresh |
| **Scheduling / durability** | [`src/job-state.mjs`](src/job-state.mjs), [`sql/schema.sql`](sql/schema.sql) | Job states, claim leases, idempotency keys, attempts, retries, no duplicate publishes |
| **Comment-to-DM automation** | [`src/comment-rules.mjs`](src/comment-rules.mjs), [`examples/comment-event.mjs`](examples/comment-event.mjs) | Keyword normalization, deterministic reply rotation, 640/20-character button fallback, duplicate events |
| **Webhook security** | [`src/webhook-signature.mjs`](src/webhook-signature.mjs), [`examples/webhook-handler.mjs`](examples/webhook-handler.mjs) | Challenge handshake, raw-body HMAC, fail-closed behavior, durable enqueue before ACK |
| **Analytics / insights** | [`src/insights.mjs`](src/insights.mjs), [`docs/insights-archive.md`](docs/insights-archive.md) | Daily account snapshot quirks, safe media metric batches, historical retention |
| **Facebook Page posts** | [`examples/facebook-page-post.mjs`](examples/facebook-page-post.mjs) | Separate Graph host and Page-token path; not part of buildpurdue's implementation |
| **System architecture** | [`docs/architecture.md`](docs/architecture.md), [`docs/lessons-learned.md`](docs/lessons-learned.md) | Components, failure modes, security decisions, implementation tradeoffs |
| **Agent onboarding** | [`AGENTS.md`](AGENTS.md), [`docs/agent-build-brief.md`](docs/agent-build-brief.md) | Task-by-task implementation brief and acceptance criteria |

## Choose the correct Meta API first

**Instagram API with Instagram Login**: Uses `graph.instagram.com`, an Instagram professional account, and scopes like `instagram_business_basic`, `instagram_business_content_publish`, `instagram_business_manage_comments`, `instagram_business_manage_insights`, and `instagram_business_manage_messages`. It does **not** require a linked Facebook Page. This matches buildpurdue's Instagram integration.

**Instagram API with Facebook Login / Facebook Pages**: Uses `graph.facebook.com`, a different login flow and permissions, and often a linked Facebook Page for Instagram access. Facebook Page publishing uses Page access tokens. **Do not mix the two flows.** See [`docs/authentication.md`](docs/authentication.md).

## To understand the publish path quickly

1. Authenticate a permitted Instagram professional account and obtain a long-lived user token.
2. Serve the intended image/video from a public URL reachable by Meta. Local files and inaccessible preview URLs will fail.
3. `POST /{ig-user-id}/media` to create a publishing container, then (for async video processing) poll the container's status.
4. `POST /{ig-user-id}/media_publish` using the `creation_id` to publish the container.
5. Persist container ID, post ID, user/account, idempotency key, status, attempts, and timestamps. Confirm ambiguous failures before trying to publish again.

This repo's `publish-image.mjs` is **dry-run by default**. Set `EXECUTE_LIVE_PUBLISH=YES_I_UNDERSTAND` and supply real credentials only when you intend to publish an actual post. Do not enable it as a test of credentials.

## Fast local inspection

```bash
node --version        # Node 20+
npm test              # exercises the pure helpers
npm run check         # syntax validation of all JS examples
node examples/publish-image.mjs # prints planned calls; NO publishing by default
```

## What you can copy

All snippets are independent, sanitized reference examples. Review them for correctness and current API compatibility before using them. The original private monorepo and its history are **not** part of this package, and the references to its internal paths are informational. Any future upstream-code import needs a separate license and secret review.

## Primary references

- [Meta-maintained Instagram API Postman collection](https://www.postman.com/meta/workspace/instagram/documentation/23987686-9386f468-7714-490f-9bfc-9442db5c8f00)
- [Meta Instagram API with Instagram Login overview](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login)
- [Meta Instagram content publishing](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing)
- [Meta Instagram Business Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login)
- [Meta Instagram API content publishing reference](https://developers.facebook.com/docs/instagram-platform/reference/instagram-user/media)
- [Meta Webhooks documentation](https://developers.facebook.com/docs/graph-api/webhooks/)

**Verification date:** October 9, 2026. Examples pin `v25.0` only as a configurable demonstration value, not as a claim that it is the latest available release.

## Publish the new public repository

GitHub repository creation requires an authenticated `gh` CLI or browser session. After reviewing [`docs/security-publication-checklist.md`](docs/security-publication-checklist.md) and confirming rights to release the adapted examples, run `bash scripts/publish-public.sh meta-auto-posting-starter` from the extracted folder. The script verifies syntax/tests, initializes a fresh Git history, requests explicit confirmation, creates the **public** repository, and pushes. It cannot inherit any private monorepo commit history.
