# OAuth 2.0 Express Example

A minimal Express server that demonstrates the SoundCloud OAuth 2.0 authorization code flow.

## Setup

1. Register an app at [SoundCloud for Developers](https://soundcloud.com/you/apps) and note your **Client ID**, **Client Secret**, and set the **Redirect URI** to `http://localhost:3000/callback`.

2. Edit `server.ts` and replace the placeholder credentials:

   ```ts
   const CLIENT_ID = "YOUR_CLIENT_ID";
   const CLIENT_SECRET = "YOUR_CLIENT_SECRET";
   ```

3. Install dependencies and start:

   ```bash
   cd examples/oauth-express
   npm install
   npm start
   ```

4. Visit [http://localhost:3000/login](http://localhost:3000/login) to begin the OAuth flow.

## Endpoints

| Route | Description |
| --- | --- |
| `GET /login` | Redirects to SoundCloud authorization page |
| `GET /callback` | Exchanges the authorization code for tokens |
| `GET /me` | Returns the authenticated user's profile as JSON |
