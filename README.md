## Snake Game

Run the game in just a few commands. Works great on a home server or your laptop.

Requirements
- Node 18+ (20+ recommended)
- npm 9+

Quick start (4 commands)
```bash
# 1) Install
npm install

# 2) (Optional) Copy defaults – already set for easy home hosting
cp server/.env.example server/.env

# 3) Deploy the SQLite DB (migrations)
npm run db:deploy

# 4) Build and run
npm run build && npm start
```

Open http://localhost:4000 (or http://<server-ip>:4000 on your LAN). The server serves the built client and the API.

Defaults that “just work”
- `CORS_ORIGIN=*` (allow all; it’s a toy app for home hosting)
- `DATABASE_URL=file:./dev.db` (SQLite file lives under `server/prisma/`)
- `PORT=4000`
- You can edit `server/.env` anytime to change these.

Optional: keep it running with PM2 (3 commands)
```bash
npm i -g pm2
cp ecosystem.config.js.example ecosystem.config.js
pm2 start ecosystem.config.js --only snake-server && pm2 save && pm2 startup
```
Tip: If you prefer a one‑liner instead of the ecosystem file, use an ABSOLUTE cwd:
```bash
pm2 start npm --name snake-server -- run start:migrate --cwd /absolute/path/to/SnakeGame/server --time
```

Update later (pull changes and restart)
```bash
git pull
npm install
npm run build
pm2 restart snake-server   # if using PM2
```

API (for curiosity)
- GET `/health` → `{ ok: true }`
- POST `/api/users` → `{ username, snakeColor?, snakeType? }`
- PUT `/api/users/:id` → `{ snakeColor?, snakeType? }`
- POST `/api/scores` → `{ userId, value }`
- GET `/api/leaderboard?limit=10`


