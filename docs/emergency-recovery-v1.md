# CCPun Emergency Recovery v1

Date: 2026-08-24
Status: Break-glass baseline

## Purpose

Keep CCPun recoverable when the primary notebook is unavailable and an incident is too privileged for Codex Cloud to resolve directly.

This runbook records **where control lives and how to recover it**. It must never contain plaintext passwords, private keys, recovery codes, OAuth secrets, or API tokens.

## Recovery principle

```text
Code problem
-> Codex Cloud / GitHub / Vercel Preview

Runtime problem
-> Vercel Dashboard + GitHub rollback path

DNS / domain / identity / secret problem
-> Human break-glass access

Primary notebook unavailable
-> Phone or spare computer + independent recovery factors
```

Codex Cloud is an engineering fallback, not the master control-plane credential holder.

## Incident levels

| Level | Typical problem | Default responder |
|---|---|---|
| L1 | Code/UI/SEO regression | Codex Local/Cloud + normal PR flow |
| L2 | Bad deployment/runtime config | Human Vercel access, Codex may diagnose |
| L3 | DNS/domain/OAuth/Production-secret issue | Human break-glass only |
| L4 | Account/provider recovery | Human identity recovery / provider support |

## Critical provider inventory

The owner must be able to identify and access these from a device other than the primary notebook:

1. Domain registrar / nameserver control.
2. DNS provider.
3. Vercel team and projects.
4. GitHub repository and recovery controls.
5. Sanity Production and Non-Production projects.
6. Primary Google/OAuth identity.
7. Password manager / secure recovery store.

Repository-safe identifiers currently used by the platform:

- Vercel Web Production project: `prj_dxwjITkd0av5QiJQv2snUlIASUWu`.
- Vercel Admin Production project: `prj_6tuUxJxYbQ4mpF7sMgNWx2p2jowN`.
- Sanity Production: `kyfxgjnq/production`.
- Sanity Non-Production: `ccb9lnw5/uat`.
- Production code branch during migration: `v4-production`.

Do not store provider passwords or secret values beside this inventory.

## Required recovery factors

For the primary identity and critical control-plane providers:

- Enable MFA/passkeys where supported.
- Keep at least two independent recovery paths.
- Prefer two hardware security keys stored in different physical locations.
- Store recovery codes outside the primary notebook in a secure offline or password-manager recovery location.
- Do not make one phone, one notebook, one email session, or one authenticator the only path back into every account.

## If the notebook is unavailable

1. Use the phone or a spare/trusted computer.
2. Restore access to the primary identity first.
3. Open GitHub/Vercel/DNS directly; Codex Cloud is optional assistance, not a dependency.
4. Diagnose the incident before changing Production.
5. Prefer the smallest reversible recovery action.
6. Record what changed and the rollback reference after service is restored.

## Web outage

### First check

1. Verify whether the public domain resolves.
2. Check the Vercel Production project and latest deployment status.
3. Determine whether the problem is code, runtime, DNS, or provider-wide.

### If the latest deployment is bad

Prefer a known-good Vercel/Git rollback over live manual edits.

```text
known-good Git SHA / deployment
-> restore or revert
-> verify ccpun.com
-> open follow-up PR for the root cause
```

Do not change DNS to solve an ordinary application regression.

## Vercel outage

If Vercel itself is unavailable:

1. Confirm the provider outage before changing DNS.
2. Keep the primary DNS configuration unchanged for short/transient outages.
3. If the outage is prolonged and business continuity requires it, the owner may point the public domain to a separately hosted emergency static contact page.
4. Record the original DNS values before changing them.
5. Restore the normal target only after Vercel health and the production deployment are verified.

An emergency static page should contain only essential brand/contact information and must not attempt to replicate the full authenticated Admin or content platform.

## DNS or domain incident

DNS/domain mutation is a human break-glass action.

1. Sign in to the registrar/DNS provider directly.
2. Compare live records with the approved known-good DNS snapshot.
3. Change only the incorrect record(s).
4. Do not rotate unrelated nameservers or records during the incident.
5. Verify public resolution and HTTPS after the change.
6. Record the before/after state and time.

Codex Cloud may inspect public DNS and propose exact record changes, but it must not be given standing unrestricted DNS-admin credentials merely for convenience.

## Identity/account lockout

Recover the identity layer before changing infrastructure.

1. Use a backup passkey/security key.
2. Use the provider recovery process or offline recovery code if required.
3. Verify account activity after recovery.
4. Rotate credentials only when compromise is suspected or confirmed.
5. Re-establish independent recovery factors before closing the incident.

## Production secret incident

Examples: OAuth secret revoked, Admin auth secret invalid, Sanity token revoked.

1. Identify the exact affected credential and consumer.
2. Generate/rotate the credential through the owning provider as the human owner.
3. Update only the intended Production project/environment.
4. Do not copy Production secrets into Codex Cloud or Non-Production environments.
5. Verify the affected route/workflow.
6. Revoke the old credential after the replacement is proven when appropriate.

## Sanity incident

Code rollback and content rollback are separate operations.

- Code/runtime rollback -> GitHub/Vercel.
- Content/revision rollback -> Sanity History / approved content recovery path.

Never assume rolling Vercel back also restores Production content.

## Known-good recovery record

Maintain a small operational record outside the primary notebook and mirror the non-secret portion in GitHub:

```text
Current good Web release: web-vX.Y.Z
Git SHA: <sha>
Vercel Production deployment: <deployment id>
Web Production project: <project id>
Admin Production project: <project id>
Sanity Production: <project/dataset>
Sanity Non-Production: <project/dataset>
DNS snapshot last verified: <date>
Recovery material location: <location name only; never secret values>
```

## After every incident

Record:

1. What failed.
2. Root cause if known.
3. What was changed.
4. Who/what executed the change.
5. Git/Vercel/Sanity/DNS reference where applicable.
6. Verification result.
7. Rollback path.
8. Follow-up prevention work.

The goal is not zero incidents. The goal is that recovery never depends on remembering an undocumented configuration from one unavailable notebook.
