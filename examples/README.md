# Examples

Practical, copy-paste-ready examples for `soundcloud-api-ts`.

| Example | Description |
| --- | --- |
| [basic-usage.ts](./basic-usage.ts) | Get a track, search tracks, get a user and their tracks |
| [pagination.ts](./pagination.ts) | Paginate through search results with `paginate`, `paginateItems`, and `fetchAll` |
| [pkce-spa.ts](./pkce-spa.ts) | PKCE authorization flow for browser / public clients |
| [oauth-express/](./oauth-express/) | Minimal Express server demonstrating the OAuth 2.0 authorization code flow |

## Running

```bash
# Install dependencies in the repo root
npm install

# Run any example with tsx
npx tsx examples/basic-usage.ts
```

> **Note:** Replace placeholder credentials (`YOUR_CLIENT_ID`, etc.) with real values before running.
