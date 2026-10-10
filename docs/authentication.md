# Authentication and authorization

**The most expensive mistake is mixing Meta's Instagram Login and Facebook Login paths.** They use different hosts, token owners, permissions, and account resolution.

## Path A: Instagram API with Instagram Login (the buildpurdue path)

- Instagram professional accounts: Business and Creator.
- API host: `https://graph.instagram.com/{version}`.
- OAuth authorize endpoint: `https://www.instagram.com/oauth/authorize`.
- Short-lived code exchange: `POST https://api.instagram.com/oauth/access_token`.
- Exchange to long-lived: `GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token...`.
- Refresh long-lived: `GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token...`.
- Example permissions: `instagram_business_basic`, `instagram_business_content_publish`, `instagram_business_manage_comments`, `instagram_business_manage_insights`, `instagram_business_manage_messages`. Ask only for scopes the app uses.
- No linked Facebook Page required by the Instagram Login API.
- Long-lived tokens are typically valid for about 60 days; refresh them before expiry. A long-lived token must be at least 24 hours old and unexpired to refresh. Reauthorize revoked tokens.
- The Instagram app ID/secret for this product are not interchangeable with an unrelated Meta app's Facebook Login credentials.

See `src/oauth.mjs` and `src/token-lifecycle.mjs` for portable examples.

## Path B: Instagram API with Facebook Login

- Graph host: `graph.facebook.com`.
- Requires Facebook Login, Page relationship/tasks, and relevant permissions. The Instagram account is often resolved from the selected Facebook Page's `instagram_business_account` field.
- Uses scopes such as `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, with additional permissions for specific actions.
- **Never use IG-business tokens from Path A as Page access tokens or vice versa.**

## Path C: publishing to a Facebook Page

- Graph host: `graph.facebook.com`.
- To publish a basic Page feed message: `POST /{page-id}/feed` with a **Page access token** and appropriate approved Page permissions/tasks.
- This is included only as a conceptual extension (`examples/facebook-page-post.mjs`). buildpurdue's code does not implement it.

## Real OAuth implementation checklist

1. Register callback URL in Meta app. Use TLS and exact redirect URI matching.
2. Generate cryptographically strong state; store it server-side with a session, TTL, and one-time consumption. Reject missing/replayed/mismatched state.
3. Exchange code server-side; exchange to long-lived token. Store token in Vault/key management, not in a plaintext user table.
4. Verify current granted permissions and professional account identity after login. Each publish must be scoped to an account the signed-in user owns/manages.
5. Schedule rotation with an error path for expired/revoked credentials. If refresh fails, disable queued publishing and ask the user to reconnect.
6. Validate the app's development/live mode and App Review requirements. Your own testing user may work while other users cannot authorize the integration.
7. Never output the code, OAuth tokens, app secret, or full credentials in logs, crash reports, queues, or telemetry.
8. Make account disconnect, credential deletion, and scheduled-publish cancellation available.

## Source documentation

- https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
- https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login
- https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token
- https://www.postman.com/meta/workspace/instagram/documentation/23987686-9386f468-7714-490f-9bfc-9442db5c8f00
