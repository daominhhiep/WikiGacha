# wikigacha

Wikigacha is a unique collectible card game where every Wikipedia article is a playable card. Articles are dynamically transformed into game entities with stats derived from their real-world metadata (page views, article length, edit history, and more). Players can open gacha packs, manage their collections, build strategic decks, and engage in PvP battles.

---

## 🎮 User Perspective: How to Play

### 1. Collect Cards
Every card in Wikigacha represents a real Wikipedia article. You can obtain cards by opening **Gacha Packs**. Each pack contains a random selection of articles from across Wikipedia's vast knowledge base.

### 2. Manage Your Inventory
View your collection of cards in the **Inventory**. Each card displays:
- **Stats:** Attack, Defense, and Special abilities generated from Wikipedia data.
- **Rarity:** Determined by the article's prominence and metadata.
- **Link:** A direct link to the original Wikipedia article for learning more.

### 3. Build Your Deck
Strategically select your best cards to form a **Deck**. A well-balanced deck is crucial for success in the battle arena.

### 4. Battle
Challenge other players in **PvP Battles**. The battle engine simulates encounters based on card stats and deck synergy, rewarding winners with resources to open more packs.

---

## 🛠 Developer Perspective: Building & Running

### Tech Stack
- **Frontend:** React, Vite, TypeScript, Shadcn UI, Tailwind CSS, TanStack Query, Zustand.
- **Backend:** NestJS, TypeScript, Prisma ORM.
- **Database:** MySQL.
- **External API:** Wikipedia MediaWiki API.
- **Infrastructure:** Docker.

### Project Structure
```text
├── backend/            # NestJS API & Business Logic
├── frontend/           # React SPA
├── docker/             # Docker Compose & DB configuration
├── specs/              # Technical specifications & design docs
└── docs/               # Coding standards & guidelines
```

### Prerequisites
- **Node.js:** v20 or higher
- **Docker:** For running the MySQL database
- **npm:** Package manager

### Getting Started

#### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd wikigacha
npm install
```

#### 2. Setup the Database
Launch the MySQL container using Docker:
```bash
docker-compose -f docker/docker-compose.yml up -d
```

#### 3. Environment Configuration
Create `.env` files in both `backend/` and `frontend/` directories based on the provided examples in their respective `GEMINI.md` or README files.

**Backend (`backend/.env`):**
```env
DATABASE_URL="mysql://root:password@localhost:3306/wikigacha"
WIKIPEDIA_API_URL="https://en.wikipedia.org/w/api.php"
JWT_SECRET="your_secret_key"
PORT=3000
```

**Frontend (`frontend/.env`):**
```env
VITE_API_BASE_URL="http://localhost:3000"
```

#### 4. Database Migration
Apply the Prisma schema to your MySQL instance:
```bash
cd backend
npx prisma migrate dev --name init
```

#### 5. Run the Application
Start both services in development mode:

**Start Backend:**
```bash
cd backend
npm run start:dev
```

**Start Frontend:**
```bash
cd frontend
npm run dev
```

### Development Commands
- `npm test`: Runs test suites for both frontend and backend.
- `npm run lint`: Checks for code style and linting issues.

---

## 📖 Documentation
Detailed technical documentation, including API contracts and data models, can be found in the `/specs` and `/docs` directories.

- [Coding Standards](./docs/coding-standards.md)
- [API Specification](./specs/001-wikigacha-core/contracts/api.md)
- [Data Model](./specs/001-wikigacha-core/data-model.md)

## ⚖️ License
This project is licensed under the MIT License.
