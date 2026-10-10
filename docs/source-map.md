# Provenance: where the buildpurdue ideas came from

The links below point into a **private** repository and will not work for someone without access. They are for the original maintainer's traceability. Everything an external agent needs to begin is reproduced as independent, sanitized examples inside this kit.

| Private source path | What was examined | Standalone alternative in this kit |
| --- | --- | --- |
| [`src/lib/instagram/graph-client.ts`](https://github.com/karthikcsq/buildpurdue-website/blob/main/src/lib/instagram/graph-client.ts) | Graph requests, throttling, live media lookup, replies and private messages | `src/graph-client.mjs`, `src/comment-rules.mjs` |
| [`src/lib/instagram/comment-matching.ts`](https://github.com/karthikcsq/buildpurdue-website/blob/main/src/lib/instagram/comment-matching.ts) | Keyword normalization, deterministic reply rotation | `src/comment-rules.mjs` |
| [`src/lib/instagram/comment-messages.ts`](https://github.com/karthikcsq/buildpurdue-website/blob/main/src/lib/instagram/comment-messages.ts) | Template/button caps, fallback, tracked links | `src/comment-rules.mjs` |
| [`src/lib/instagram/comment-rule-input.ts`](https://github.com/karthikcsq/buildpurdue-website/blob/main/src/lib/instagram/comment-rule-input.ts) | Validation for activation and message rules | `docs/lessons-learned.md` |
| [`supabase/functions/instagram-comment-webhook/index.ts`](https://github.com/karthikcsq/buildpurdue-website/blob/main/supabase/functions/instagram-comment-webhook/index.ts) | Meta webhook, idempotency, quick ACK, send dispatch | `examples/webhook-handler.mjs`, `docs/architecture.md` |
| [`supabase/functions/_shared/webhook-signature.ts`](https://github.com/karthikcsq/buildpurdue-website/blob/main/supabase/functions/_shared/webhook-signature.ts) | Constant-time raw-body HMAC verification | `src/webhook-signature.mjs` |
| [`supabase/functions/instagram-insights-sync/index.ts`](https://github.com/karthikcsq/buildpurdue-website/blob/main/supabase/functions/instagram-insights-sync/index.ts) | Daily/hourly sync, Graph API metric shapes, token refresh, retries | `src/insights.mjs`, `docs/insights-archive.md` |
| [`supabase/functions/instagram-story-webhook/index.ts`](https://github.com/karthikcsq/buildpurdue-website/blob/main/supabase/functions/instagram-story-webhook/index.ts) | Story webhook processing | `docs/lessons-learned.md` (availability caveat) |
| [`docs/instagram-analytics.md`](https://github.com/karthikcsq/buildpurdue-website/blob/main/docs/instagram-analytics.md) | Architecture, setup, observed issues | `docs/insights-archive.md`, `docs/authentication.md` |
| [`docs/features/instagram-comment-automation.md`](https://github.com/karthikcsq/buildpurdue-website/blob/main/docs/features/instagram-comment-automation.md) | End-to-end rule/webhook/retry design | `docs/lessons-learned.md`, `examples/comment-event.mjs` |
| [`src/lib/social/platform-workflow-config.ts`](https://github.com/karthikcsq/buildpurdue-website/blob/main/src/lib/social/platform-workflow-config.ts) | Manual Instagram publishing workflow | `README.md` caveat; not claimed as automatic posting |

No `.env`, raw database dump, credential, secret URL, complete private file, or account-specific identifier is included. These links are not license grants for code from the original monorepo.
