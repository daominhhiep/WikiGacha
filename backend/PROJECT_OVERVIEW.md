# Project Overview: Wikigacha

## 🚀 Concept
Wikigacha is a multiverse-themed gacha game where every Wikipedia article is a collectible card. Players extract data from the "Wikipedia Core" to generate unique combat assets with stats derived from real-world metadata.

## 🛠 Tech Stack
- **Frontend:** React 19, Vite, Tailwind CSS (v4), Shadcn UI, TanStack Query, Zustand.
- **Backend:** NestJS, Prisma 7, MySQL, Redis, Wikipedia MediaWiki API.
- **Vibe:** Cyberpunk, Sci-Fi, Data-Terminal.

## 🎯 Core Features
- **Data Breach (Gacha):** Extract articles from Wikipedia to generate cards.
- **Article Summaries:** Every card links back to its source article.
- **Derived Stats:** Rarity, HP, ATK, and DEF are calculated based on article popularity and depth.
- **Inventory Management:** Store and browse collected data units.
- **Combat Simulation:** (Planned) Battle cards based on their attributes.

## 🧬 Design System (Cyberpunk)
- **Anti-Softness Rule:** No rounded corners (`rounded-none`).
- **HUD Elements:** Decorative scanning lines and HUD corners.
- **Rarity System (Q-Score):**
  Based on Wikipedia article quality score from **WikiRank (0-100)**. [WikiRank](https://wikirank.net/)
  
  | Rank | Meaning | Q-Score | Multiplier |
  | :--- | :--- | :--- | :--- |
  | **LR** | Legend Rare | 100 (Peak Quality) | 1.5x |
  | **UR** | Ultra Rare | 90+ | 1.3x |
  | **SSR** | Super Special Rare | 80+ | 1.1x |
  | **SR** | Super Rare | 60+ | 0.9x |
  | **R** | Rare | 35+ | 0.7x |
  | **UC** | Uncommon | 20+ | 0.5x |
  | **C** | Common | Below 20 | 0.3x |
- **Color Palette:** Neon Cyan (R), Purple (SR), and Gold (SSR) accents on a deep space background.
- **Monospace Typography:** All numeric data and IDs use `JetBrains Mono` or `Fira Code`.

## 📦 Implemented Stories
### US1: Open Card Packs (MVP)
- **Backend:** Wikipedia client with random article retrieval and summary fetching.
- **Guest Auth:** Automatic session creation for new users with `POST /auth/guest`.
- **Gacha Engine:** Credit-based pack opening with rarity derivation logic.
- **Frontend:** Data-terminal style gacha page with breach animation.
- **Card UI:** Cyberpunk-themed cards with full Wikipedia attribution and links.

### US3: Battle with Wikipedia Cards
- **Battle Engine:** Server-side auto-battle simulation (Turn-based logic).
- **PvE Mode:** Challenge AI opponents using random card data.
- **Rewards System:** Earn credits and XP based on battle results; automatic level-up.
- **Battle History:** Track past combat logs and winners.
- **Visualizer:** Frontend playback of combat logs with animations, health bars, and live logs.
- **Endpoints:**
  - `POST /api/v1/battle/start` - Start an auto-battle with a selected deck.
  - `GET /api/v1/battle/history` - Retrieve player's battle history.

### US5: Trophy System & Milestones
- **Trophy Engine:** Event-driven achievement tracking.
- **Milestones:**
  - **LEGENDARY_FINDER:** Awarded when pulling a UR or LR card from a pack.
  - **VETERAN_COMMANDER:** Awarded after winning 10 battles (PvE or PvP).
- **Backend:** `TrophyService` listening to `card.pulled` and `battle.won` events.
- **Endpoints:**
  - `GET /api/v1/trophies/:playerId` - Retrieve all trophies unlocked by a player.

### US14: Daily & Lifetime Missions
- **Mission Engine:** Event-driven progress tracking for daily and lifetime goals.
- **Criteria Types:**
  - **PULL_CARDS:** Track number of cards pulled from gacha packs.
  - **PLAY_BATTLES:** Track total auto-battles played.
  - **WIN_BATTLES:** Track total victories in auto-battles.
- **Backend:** `MissionService` listening for `card.pulled` and `battle.finished` events.
- **Rewards:** Claim `rewardCredits` upon mission completion.
- **Logic:** Atomic reward claiming using database transactions to ensure data integrity.
- **Endpoints:**
  - `GET /api/v1/missions` - List all static missions.
  - `GET /api/v1/missions/:playerId` - Fetch user-specific mission progress.
  - `POST /api/v1/missions/claim` - Claim credits for a completed mission.

## 📝 API Documentation
- **Swagger UI:** Accessible at `/docs` when the server is running.
- **Auth Endpoints:**
  - `POST /api/v1/auth/guest` - Create a guest player session.
  - `GET /api/v1/auth/me` - Fetch the current player's profile (requires JWT).
- **Gacha Endpoint:** `POST /api/v1/gacha/open` - Initiates a data breach to acquire 5 new cards.
