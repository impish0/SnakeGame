## Snake Game (Monorepo)

A simple full‑stack Snake game. The repo contains a React + Vite client and an Express + Prisma (SQLite) server. The server also serves the built client in production.

### Prerequisites
- **Node**: 18+ (recommend 20+)
- **npm**: 9+

### Install
Run this once at the repo root to install workspace deps for both `client` and `server`:

```bash
npm install
```

### Environment
Create `server/.env` (SQLite by default):

```bash
# server/.env
DATABASE_URL="file:./dev.db"
PORT=4000
```

Then generate the Prisma client and apply migrations:

```bash
npm run -w server prisma:generate
npm run -w server prisma:migrate
```

### Development
Run client and server together from the repo root:

```bash
npm run dev
```

- Client: http://localhost:5173 (Vite default)
- Server API: http://localhost:4000

### Build and run (production)

```bash
npm run build
npm start
```

The server will serve the compiled client at `http://localhost:4000` and expose APIs under `/api/*`.

### API quick reference
- **GET** `/health` → `{ ok: true }`
- **POST** `/api/users` → Create or fetch user by `username`
  - Body: `{ "username": string, "snakeColor"?: string, "snakeType"?: string }`
- **PUT** `/api/users/:id` → Update user preferences
  - Body: `{ "snakeColor"?: string, "snakeType"?: string }`
- **POST** `/api/scores` → Submit a score
  - Body: `{ "userId": string, "value": number }`
- **GET** `/api/leaderboard?limit=10` → Top scores with user info

### Scripts
From repo root:

```bash
# Dev both apps concurrently
npm run dev

# Build client then server
npm run build

# Start server (runs migrations first)
npm start
```

Direct workspace scripts (optional):

```bash
# Server
npm run -w server dev
npm run -w server build
npm run -w server prisma:generate
npm run -w server prisma:migrate

# Client
npm run -w client dev
npm run -w client build
npm run -w client preview
```

### Project structure
- `client/` — React + Vite + Tailwind UI
- `server/` — Express API with Prisma (SQLite). Serves built client in prod

### Troubleshooting
- If you see Prisma errors like "Prisma Client not found", run:

```bash
npm run -w server prisma:generate
```

- If migrations haven’t been applied locally, run:

```bash
npm run -w server prisma:migrate
```


