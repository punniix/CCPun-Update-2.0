# Website 4.2 Post-Live Analytics Foundation

This key-free UAT surface models historical metrics collected only after a Live ends.

- Every snapshot links to a publication, channel variant, and Master Content.
- Platform-native metric names and units remain unchanged.
- Normalized CCPun metrics are stored separately and never replace source metrics.
- Provider state is explicit: `available`, `unavailable`, or `unsupported`.
- Collection mode is manual Post-Live only. There is no real-time polling, background cron, provider request, database write, or Sanity write.

The next key-required phase may replace the synthetic fixture with an approved provider client and manual fetch. OAuth scopes, provider limits, reporting delay, and historical availability must be verified per platform before enabling it.
