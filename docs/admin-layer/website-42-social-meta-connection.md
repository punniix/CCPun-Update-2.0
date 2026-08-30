# Website 4.2 Meta Connection Foundation

This UAT-only surface normalizes synthetic Facebook Page and Instagram account discovery. It is authenticated with `social:read`, exact-origin protected, and available only on the existing Website 4.2 Admin UAT lane.

- Minimum read scopes: `pages_show_list`, `instagram_basic`
- Multiple Pages require an explicit selected Page
- A Page without Instagram is reported as `not-linked`
- Expired or revoked authorization is reported as `reconnect-required`
- No provider request, OAuth mutation, token field, publishing scope, Insights scope, database write, Sanity write, or Production behavior exists in this batch

The next provider-connected phase must add OAuth lifecycle and real Page discovery under a separate approval. Publishing and analytics permissions remain separate later phases.
