# Memory Connector

Memory Connector - MVP Implementation

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker and Docker Compose
- PostgreSQL 16+ (via Docker)
- Redis 7+ (via Docker)

## Quick Start

```bash
# Install dependencies
pnpm install

# Start database and Redis
pnpm db:up

# Generate Prisma client
cd apps/api && pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Start development servers
pnpm dev
```

## Project Structure

```
/
├── apps/
│   ├── api/          # NestJS backend API
│   ├── web/          # React + Vite frontend
│   └── worker/       # Background jobs (future)
├── packages/
│   ├── shared/       # Shared types, schemas, utilities
│   ├── eslint-config/
│   └── tsconfig/
├── infra/
│   └── compose/      # Docker Compose files
└── docs/             # Documentation
```

## Development

### Local Development

```bash
# Start services
pnpm db:up

# Run API (port 4000)
cd apps/api && pnpm dev

# Run Web (port 5173)
cd apps/web && pnpm dev
```

### Docker Development

```bash
# Start all services with hot reload
pnpm compose:up
```

## Testing

```bash
# Run all tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Type checking
pnpm typecheck
```

## Database

```bash
# Run migrations
pnpm db:migrate

# Seed data
pnpm db:seed

# Open Prisma Studio
cd apps/api && pnpm db:studio
```

## Documentation

- [Architecture](docs/architecture.md) - System architecture and data flow
- [API Reference](docs/api.md) - API endpoint documentation
- [Runbooks](docs/runbooks.md) - Operational runbooks
- [Debugging & Testing (Windows)](docs/DEBUGGING_AND_TESTING_WINDOWS.md) - **Windows-specific debugging guide**
- [Windows Quick Start](docs/WINDOWS_QUICK_START.md) - Quick reference for Windows
- [Implementation Planning](Docs/Implementation_Planning.md) - Planning guide
- [Smoke Tests](SMOKE_TESTS.md) - Verification procedures

## Environment Variables

See `.env.example` files in each app directory for required environment variables.

## License

Private

