## Snake Game

One-and-done setup to run locally or on a home server.

Prereqs
- Node 18+ (Node 20+ recommended)
- npm 9+

Quick start
1) Install deps (from repo root):
```bash
npm install
```

2) Database (SQLite) – deploy existing migrations:
```bash
npx prisma migrate deploy --schema server/prisma/schema.prisma
```

3) Build + run (from repo root):
```bash
npm run build
npm start
```

That’s it. The server will serve the built client on the same origin.

Defaults and config
- `server/.env.example` is geared for easy home hosting:
  - `CORS_ORIGIN=*` (allow all; this is a toy app)
  - `DATABASE_URL="file:./dev.db"`
  - `PORT=4000`
- Copy it once if you want to tweak values:
```bash
cp server/.env.example server/.env
```
- Optional: set `PUBLIC_API_URL` in `server/.env` if the client is hosted elsewhere; otherwise, it defaults to same-origin via `/config.json`.

Dev mode (optional)
```bash
npm run dev
```
- Client: http://localhost:5173
- API: http://localhost:4000

Keep it running (optional PM2)
```bash
npm i -g pm2
pm2 start ecosystem.config.js --only snake-server   # after copying the example below
pm2 save && pm2 startup
```

API
- GET `/health` → `{ ok: true }`
- POST `/api/users` → `{ username, snakeColor?, snakeType? }`
- PUT `/api/users/:id` → `{ snakeColor?, snakeType? }`
- POST `/api/scores` → `{ userId, value }`
- GET `/api/leaderboard?limit=10`

PM2 example config
- Copy the example and start with PM2 to avoid npm/workspace issues on reboot/resurrect.
```bash
cp ecosystem.config.js.example ecosystem.config.js
pm2 start ecosystem.config.js --only snake-server
pm2 save && pm2 startup
```
If you prefer a one-liner instead of the ecosystem file, use an ABSOLUTE cwd so resurrects work:
```bash
pm2 start npm --name snake-server -- run start:migrate \
  --cwd /home/<user>/SnakeGame/server --time
```


