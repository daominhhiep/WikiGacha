# Quickstart: WikiGacha Core

## Prerequisites
- **Docker** and **Docker Compose**
- **Node.js 20+**
- **npm** (Default package manager)

## Launching with Docker (Recommended)
To start the entire stack (Frontend, Backend, MySQL, Redis):

```bash
docker-compose -f docker/docker-compose.yml up -d
```

Access the application at:
- **Frontend**: `http://localhost:5173`
- **Backend (API)**: `http://localhost:3000/api/v1`
- **Swagger Docs**: `http://localhost:3000/docs`

## Local Development Setup

### 1. Install Dependencies
Run from the repository root:
```bash
npm install
```

### 2. Configure Environment
1. Create `backend/.env` from `backend/.env.example`.
2. Create `frontend/.env` from `frontend/.env.example`.

### 3. Initialize Database
Ensure MySQL is running, then in `backend/`:
```bash
npx prisma migrate dev
```

### 4. Start Development Servers
```bash
# In backend/
npm run start:dev

# In frontend/
npm run dev
```

## Running Tests
```bash
# Backend (Jest)
cd backend && npm test

# Backend E2E
cd backend && npm run test:e2e

# Frontend (Vitest)
cd frontend && npm test
```

## Maintenance
To refresh card stats or purge old data:
```bash
cd backend
npm run refresh-cards
```
