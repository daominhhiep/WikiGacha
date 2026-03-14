# WikiGacha

Wikigacha is an immersive, cyberpunk-themed collectible card game where every Wikipedia article is a combat-ready asset. Articles are dynamically transformed into game entities with stats derived from real-world metadata (page views, article length, language count, and more).

---

## 🎮 Game Loop

### 1. Breach Wikipedia (Gacha)
Access the "Wikipedia Core" to extract data and acquire new cards. Each breach grants 5 unique units.
- **Cyberpunk HUD:** Immersive, single-frame data terminal interface.
- **Rarity System:** Derived from article prominence (C, UC, R, SR, SSR, UR, LR).
- **Pity System:** Guaranteed high-value signals after 10 unsuccessful breaches.

### 2. Manage Repository (Collection)
Browse your acquired assets in a high-density data grid.
- **Deep Analytics:** View detailed Wikipedia summaries and metadata for every card.
- **Filtering:** Sort and filter by rarity, acquisition date, or search query.
- **Dynamic Sizing:** Optimized card layouts for high-density browsing.

### 3. Combat Simulation (Battle)
Deploy your best units in server-side simulated encounters.
- **Deck Building:** Select up to 5 unique units for tactical engagement.
- **Auto-Battle Engine:** Turn-based combat logic with attack/defense scaling.
- **PvE Mode:** Challenge AI bots generated from the global card pool.
- **Combat Visualizer:** Watch real-time log playback with damage animations and health tracking.
- **Rewards:** Earn Credits and XP to level up and fund future breaches.

---

## 🛠 Technical Architecture

### Tech Stack
- **Frontend:** React, Vite, TypeScript, Framer Motion (Animations), Shadcn UI, Tailwind CSS, TanStack Query, Zustand.
- **Backend:** NestJS, TypeScript, Prisma ORM.
- **Cache:** Redis (Metadata and session caching).
- **Database:** MySQL.
- **Data Source:** Wikipedia MediaWiki API & WikiRank.
- **Infrastructure:** Docker.

### Performance (SC-001)
The system is optimized for sub-second responses:
- **Background Refill:** Database pool is continuously replenished in the background.
- **Redis Caching:** High-traffic metadata (pool counts, article stats) is cached to minimize external API latency.
- **Audit Results:** Average unit generation time is ~700ms, well below the 2s target.

---

## 🚀 Getting Started

### Prerequisites
- **Docker** and **Docker Compose**
- **Node.js 20+**
- **npm** or **pnpm**

### Quick Launch (Docker)
```bash
docker-compose -f docker/docker-compose.yml up -d
```
Access the terminal at `http://localhost:5173`.

### Local Development Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Copy `.env.example` to `.env` in both `backend/` and `frontend/` directories.

3. **Initialize Database:**
   ```bash
   cd backend
   npx prisma migrate dev
   ```

4. **Start Servers:**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run start:dev
   
   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

---

## 📖 Documentation
- [API Specification](./specs/001-wikigacha-core/contracts/api.md)
- [Data Model](./specs/001-wikigacha-core/data-model.md)
- [Technical Plan](./specs/001-wikigacha-core/plan.md)

## ⚖️ License
MIT License. © 2026 WikiGacha Consortium.
