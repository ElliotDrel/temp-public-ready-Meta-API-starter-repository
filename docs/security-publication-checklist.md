# Pre-publication safety checklist

This project was prepared as standalone rewritten/adapted examples, not a mirror of the private buildpurdue repository. The proposed MIT license is provisional until the rights holder verifies release authority.

- [ ] Confirm the project owner has authority to release these derivative examples and choose the public license. A private repository may contain contributions from others.
- [ ] Check every file and every commit for production credential values, API tokens, `IGAA...` tokens, `.env` files, emails, personal names, internal domains, database URLs, customer data, raw webhooks, and log snippets.
- [ ] Never fork the original private monorepo into a public repository: the Git history itself may contain secrets even if the tip is clean.
- [ ] Only push the files in this kit as an **orphan/new repository history**.
- [ ] Add GitHub secret scanning / push protection and branch protection where available.
- [ ] Review third-party package licenses if dependencies are added. This starter uses only Node built-ins.
- [ ] Check that all example placeholders are inert and no CI/job runs can publish to a real social account.
- [ ] Confirm that source maps refer to a private repository only as traceability, not as a promise of public access.
- [ ] Check current Meta docs and rate-limits before deploying anything copied from this reference kit.

## GitHub release outline

1. Create a fresh, **public** repository (e.g. `meta-instagram-api-playbook`) under an authorized account.
2. Extract this archive. Run the tests and review its contents.
3. Run `git init -b main`, `git add .`, and `git commit -m 'docs: publish sanitized Meta API starter'` in the extracted directory.
4. Push only to the new empty repository; do not add the original buildpurdue remote or history.
5. Confirm public visibility in repository settings and inspect the public README without authentication.
