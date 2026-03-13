# Quickstart: Wikigacha V2 Features

## Prerequisites
- Node.js 20+
- MySQL 8+
- Redis 7+
- Wikipedia API key (optional, but recommended for higher limits)

## Installation

1. **Install new dependencies**:
   ```bash
   cd backend
   npm install socket.io-redis @nestjs/platform-socket.io @nestjs/event-emitter
   
   cd ../frontend
   npm install socket.io-client
   ```

2. **Update Prisma Schema**:
   Add new models to `backend/prisma/schema.prisma` (see `data-model.md`).
   ```bash
   cd backend
   npx prisma migrate dev --name v2-features
   ```

3. **Set Environment Variables**:
   Add to `backend/.env`:
   ```env
   REDIS_URL="redis://localhost:6379"
   CHAT_GATEWAY_PORT=3001
   PVP_GATEWAY_PORT=3002
   ```

## Key Services to Implement

### 1. `MissionService` (Backend)
- Uses `@nestjs/event-emitter` to track user actions.
- Updates `UserMission` progress in MySQL.

### 2. `PvPGateway` (Backend)
- Handles `matchmaking.join` and queues users in Redis.
- Orchestrates real-time battle steps using Socket.io.

### 3. `ChatGateway` (Backend)
- Simple global chat broadcasting.
- Stores messages in MySQL (or Redis if persistence is short-term).

### 4. `BattleEngine` (Backend Enhancement)
- Update `BattleService` to include category counter modifiers (+20% ATK).
- Implement the `DamageTaken` formula with diminishing returns.

## Local Development
1. Start Redis: `docker-compose up -d redis`
2. Start Backend: `npm run start:dev`
3. Start Frontend: `npm run dev`
4. Test Chat: Open two browser tabs and navigate to `/chat`.
5. Test PvP: Use two accounts to join matchmaking.
