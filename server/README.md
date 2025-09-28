Server notes
------------

This small document explains how to configure CORS and runtime client config
when deploying the server remotely.

Environment variables
- CORS_ORIGIN: Optional. A single origin (https://example.com), a comma-
  separated list of origins, or * to allow all origins. If unset the server
  uses a conservative default (express cors() is enabled but you should set
  this explicitly in production).
- PUBLIC_API_URL: Optional. When set, the client will read this value from
  /config.json and use it as the API base URL. If empty, the server returns
  the request origin as the API base which is convenient when serving the
  client from the same host.

Quick deploy checklist
1. Copy `server/.env.example` to `server/.env` and edit values.
2. Build the server in the `server` folder: `npm run build`.
3. Run migrations if needed: `npm run start:migrate` or `prisma migrate deploy`.
4. Start: `npm start` (or run the built artifact with `PORT=4000 node dist/index.js`).

If you are running the client separately (for example on 192.168.1.217:5173),
set `CORS_ORIGIN` to the client's origin, e.g. `http://192.168.1.217:5173`.
