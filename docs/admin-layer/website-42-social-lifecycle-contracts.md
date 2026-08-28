# Website 4.2 Social Lifecycle Contracts

This local-only batch closes two unsafe shortcuts without enabling provider execution.

- Synthetic editorial `draft` remains operational `draft`; it is never fabricated as published.
- Calendar status comes from the operational publication when one exists.
- Human approval is bound to the exact editorial revision and version.
- Publication identity is deterministic and idempotent; replay returns the existing publication and conflicting content fails closed.
- Executor claims require compare-and-swap version equality, an available or expired lease, remaining retry budget, and a non-terminal job.
- Comment execution permits only the next ordered approved position.

Every plan returns `providerWriteAllowed=false`. The contracts do not call providers, mutate the database, change Sanity, or schedule background work. A later reviewed write lane must implement these plans transactionally against the existing operational tables before any real provider adapter can run.
