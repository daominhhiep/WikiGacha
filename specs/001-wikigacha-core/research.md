# Research: Wikigacha Core Gameplay

## Decisions & Rationales

### 1. Wikipedia API Integration
- **Decision**: Use the REST API (`/page/random/summary`) for single random article fetching and the Action API for batch operations and metadata (languages).
- **Rationale**: The REST API provides a clean, JSON-friendly summary with thumbnails, perfect for card display. The Action API is necessary for deeper metrics like `langlinks`.
- **Alternatives**: Scraping Wikipedia (rejected: fragile, violates TOS).

### 2. Metrics for Card Stats
- **Decision**: 
  - **Rarity**: Based on Page Views (Normalized percentile).
  - **HP**: Derived from Language Count (Breadth of knowledge).
  - **ATK**: Derived from Page Views (Impact/Popularity).
  - **DEF**: Derived from Article Length/Word Count (Depth of content).
- **Rationale**: These metrics create a logical mapping from real-world article "importance" to game stats. Popular articles (e.g., "Earth", "Albert Einstein") become high-rarity, high-power cards.
- **Alternatives**: Purely random stats (rejected: loses the "Wikipedia" flavor).

### 3. ORM: Prisma 7
- **Decision**: Use Prisma 7 with MySQL.
- **Rationale**: Prisma 7's new TypeScript-native engine significantly improves performance and developer experience in NestJS. Its type safety is superior to TypeORM for complex card/inventory relations.
- **Alternatives**: TypeORM (rejected: more boilerplate), Drizzle (rejected: slightly higher learning curve for this specific project).

### 4. Testing Strategy
- **Decision**: 
  - **Frontend**: Vitest + React Testing Library + MSW (Mock Service Worker).
  - **Backend**: Jest (standard NestJS setup) for Unit/Integration tests.
- **Rationale**: Vitest is significantly faster for Vite-based React apps. Jest remains the most stable and integrated choice for NestJS. MSW allows for reliable Wikipedia API mocking.

### 5. Auto-Battle Engine
- **Decision**: Server-side resolution in NestJS.
- **Rationale**: Prevents cheating and ensures consistency. The frontend will only "re-play" the battle based on the backend's result log.
- **Alternatives**: Client-side resolution (rejected: security risk).

## Unresolved Clarifications Resolved
- **Testing**: Vitest (Frontend), Jest (Backend).
- **Performance**: Use Redis to cache Wikipedia article summaries to reduce API calls and improveSC-001.
- **Constraints**: Wikipedia User-Agent must include contact info.
- **Scale**: Initial MVP target 100 concurrent users.
