# Coding agent instructions

You are building an Instagram/Meta social publisher **from this reference kit**, not shipping this kit directly.

1. Read `README.md`, `docs/agent-build-brief.md`, `docs/authentication.md`, and `docs/lessons-learned.md` before coding. Choose Instagram Login vs Facebook Login and make it a recorded decision.
2. Use current official Meta docs for API versions, permissions, fields, and endpoint availability; examples are educational snapshots.
3. Inventory credentials and identify server/client trust boundaries. Credentials must live in a secret manager, never localStorage, source control, logs, or browser bundles.
4. Model a publish job with persistent states, a stable client-supplied idempotency key, leased claims, attempts, audit data, and account-scoped limits. Follow `sql/schema.sql` as a sketch, not a turnkey migration.
5. Publishing must be manually approved by default; schedule a future publish only with explicit authenticated account-owner authorization. Provide cancel/pause paths.
6. Never blindly retry `media_publish` on a timeout. Reconcile Meta's state, especially if the first request could have succeeded.
7. For webhooks, read the raw bytes, verify `x-hub-signature-256` with an app secret, deduplicate, persist work, respond quickly. Never run expensive Graph calls before the ACK.
8. Keep a durable mapping between Instagram's numeric media ID and any human-readable permalink. Shortcodes are NOT numeric media IDs.
9. Refresh long-lived tokens proactively and atomically; protect against concurrent refreshes and revoked access.
10. Write tests for retries, idempotency, duplicate webhooks, token expiry, and partial Graph failures. Clearly distinguish actual API calls from mocked responses.

Security constraints: never copy customer data, organization credentials, or private repo files into a public project. Never hard-code account IDs from examples. Never publish posts during automated tests.

Definition of done for a **real** application: all behavior above is implemented, permission-scoped, tested using mocks and controlled account integration tests, operator-monitored, and documented. The material in this repo does not meet that definition.
