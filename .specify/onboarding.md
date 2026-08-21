# Onboarding — POS Omnichannel MVP

## Quick Start

1. `npm install` — install all workspace dependencies
2. `npx prisma migrate dev --name init` — create PostgreSQL database and tables
3. `npx prisma db seed` — seed sample data
4. `npm run dev:server` — start NestJS backend on :3000
5. `npm run dev:web` — start React frontend on :3001
6. `npm run dev:mobile` — start Expo mobile app

## Project Structure

```
pos-omnichannel/
├── apps/
│   ├── server/     # NestJS backend (NestJS + PostgreSQL + Prisma)
│   ├── web/        # React + TypeScript frontend (POS Web)
│   ├── electron/   # Electron desktop app (better-sqlite3)
│   └── mobile/     # React Native (Expo) mobile app
├── packages/
│   ├── shared/     # Shared types and utilities
│   └── config/     # ESLint, TypeScript configs
├── prisma/
│   └── schema.prisma
└── e2e/
    └── tests/
```

## Key Commands

| Command | Description |
|---|---|
| `npm run build` | Build all packages |
| `npm run dev:server` | Start backend in watch mode |
| `npm run dev:web` | Start frontend in watch mode |
| `npx prisma studio` | Open Prisma DB viewer |
| `npm test` | Run Vitest unit tests |
| `npx playwright test` | Run Playwright E2E tests |
| `npm run lint` | Run ESLint |

## Architecture

- **Backend:** NestJS modular architecture with RBAC
- **Database:** PostgreSQL with Prisma ORM
- **Frontend:** React + TypeScript + Material-UI + Ant Design + Tailwind
- **Mobile:** React Native (Expo) + WatermelonDB for offline
- **Desktop:** Electron + better-sqlite3
- **Real-time:** Socket.io for multi-store event streaming
