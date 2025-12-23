# Windows Quick Start Guide

Quick reference for getting started on Windows.

## One-Time Setup

```powershell
# 1. Install Node.js (if not installed)
# Download from: https://nodejs.org/

# 2. Install pnpm
npm install -g pnpm
corepack enable

# 3. Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop
# Enable WSL 2 backend in settings

# 4. Clone and setup
git clone <repo-url>
cd "Memory Connector"
pnpm install
```

## Daily Development

```powershell
# 1. Start database and Redis
pnpm db:up

# 2. Setup database (first time only)
cd apps\api
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 3. Start backend (Terminal 1)
cd apps\api
pnpm dev

# 4. Start frontend (Terminal 2)
cd apps\web
pnpm dev
```

## Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **API Docs (Swagger)**: http://localhost:4000/api/v1/docs
- **Prisma Studio**: Run `cd apps\api && pnpm db:studio`

## Common Commands

```powershell
# Database
pnpm db:up              # Start DB/Redis
pnpm db:down            # Stop DB/Redis
pnpm db:migrate         # Run migrations
pnpm db:seed            # Seed data

# Development
pnpm dev                # Start all services
pnpm build              # Build all
pnpm test               # Run tests
pnpm lint               # Lint code
pnpm typecheck          # Type check

# Docker
docker ps               # List containers
docker logs <name>       # View logs
docker-compose logs -f  # Follow logs
```

## Troubleshooting

**Port in use?**
```powershell
netstat -ano | findstr :4000
taskkill /PID <pid> /F
```

**Docker not starting?**
- Check Docker Desktop is running
- Ensure WSL 2 is enabled
- Restart Docker Desktop

**Database connection error?**
```powershell
docker ps
docker logs memory-connector-postgres
```

**Prisma errors?**
```powershell
cd apps\api
pnpm db:generate
```

For detailed debugging, see [DEBUGGING_AND_TESTING_WINDOWS.md](DEBUGGING_AND_TESTING_WINDOWS.md)

