# Admin auto-promote Vercel deployment identifier fix

Date: 2026-08-25

Observed Production pipeline failure:
- GitHub secret `VERCEL_TOKEN` was present and accepted.
- The exact Admin Preview deployment for commit `af58fa18013d88790afe69bb220584cc14cba2ac` was READY.
- Vercel REST `/v6/deployments` returned the deployment identifier as `uid`.
- The promotion script read only `deployment.id`, producing `undefined` and a 404 from the official promote endpoint.

Fix:
- Resolve deployment identifier as `deployment.uid ?? deployment.id`.
- Require a non-empty string before promotion or Production confirmation.
- Fail closed with `ADMIN_DEPLOYMENT_ID_MISSING` when neither identifier exists.
- Keep exact project, team, commit SHA, READY-state and post-promotion confirmation guards unchanged.
