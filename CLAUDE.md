# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Run Commands

```bash
# Install all dependencies (runs prisma generate automatically)
npm install

# Development (runs client and server concurrently with hot reload)
npm run dev

# Production build
npm run build

# Start production server (runs migrations first)
npm start

# Deploy database migrations only
npm run db:deploy
```

### Client-only commands (from client/ directory)
```bash
npm run dev      # Vite dev server
npm run build    # TypeScript check + Vite build
npm run lint     # ESLint
npm run preview  # Preview production build
```

### Server-only commands (from server/ directory)
```bash
npm run dev              # ts-node-dev with hot reload
npm run build            # TypeScript compile
npm run start            # Run compiled JS
npm run start:migrate    # Run migrations then start
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Deploy migrations
```

## Architecture

This is a monorepo with npm workspaces containing a React client and Express server.

### Monorepo Structure
- **Root package.json**: Orchestrates workspaces, provides combined dev/build/start scripts
- **client/**: React 19 + Vite + TypeScript + Tailwind CSS
- **server/**: Express 5 + TypeScript + Prisma + SQLite

### Data Flow
1. Server serves the built client from `client/dist/` in production
2. Client fetches `/config.json` at runtime to discover API base URL
3. API endpoints at `/api/*` handle users, scores, and leaderboard
4. SQLite database at `server/prisma/dev.db`

### Key Files
- [server/src/index.ts](server/src/index.ts) - Single-file Express server with all API routes
- [client/src/App.tsx](client/src/App.tsx) - Complete React app in one file (menu, game canvas, leaderboard)
- [server/prisma/schema.prisma](server/prisma/schema.prisma) - Database schema (User, Score models)

### Environment Configuration
Server environment variables in `server/.env`:
- `PORT` - Server port (default: 4000)
- `CORS_ORIGIN` - Single origin, comma-separated list, or `*` for all
- `PUBLIC_API_URL` - Optional custom API base URL for client
- `DATABASE_URL` - SQLite connection string (default: `file:./dev.db`)

Client can use `VITE_API_URL` for development API override.

### API Endpoints
- `GET /health` - Health check
- `GET /config.json` - Runtime client configuration
- `POST /api/users` - Create/update user (username, snakeColor, snakeType)
- `PUT /api/users/:id` - Update user preferences
- `POST /api/scores` - Submit score (userId, value)
- `GET /api/leaderboard?limit=N` - Top scores (max 50)
