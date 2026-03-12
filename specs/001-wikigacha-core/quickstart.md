# Quickstart: Wikigacha Core Gameplay

## Prerequisites
- **Docker** and **Docker Compose**
- **Node.js 20+** (Optional, for local development)
- **PNPM** (Recommended package manager)

## Launching with Docker
To start the entire stack (Frontend, Backend, MySQL, Redis):

```bash
docker-compose up -d
```

Access the application at:
- **Frontend**: `http://localhost:5173`
- **Backend (API)**: `http://localhost:3000/api/v1`
- **MySQL**: `localhost:3306` (User: `wikiuser`, Pass: `wikipass`, DB: `wikigacha`)
- **Redis**: `localhost:6379`

## Local Development Setup

### 1. Install Dependencies
Run from the repository root:
```bash
pnpm install
```

### 2. Configure Environment
Create `.env` files in `frontend/` and `backend/` based on their respective `.env.example`.

### 3. Initialize Database
In `backend/`:
```bash
npx prisma migrate dev
```

### 4. Start Development Servers
```bash
# In backend/
pnpm start:dev

# In frontend/
pnpm dev
```

## Running Tests
```bash
# Backend (Jest)
pnpm test

# Frontend (Vitest)
pnpm test:unit
```
