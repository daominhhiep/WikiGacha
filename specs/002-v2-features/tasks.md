# Tasks: Wikigacha V2 Features

**Input**: Design documents from `/specs/002-v2-features/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Install backend dependencies: `npm install @nestjs/platform-socket.io socket.io @socket.io/redis-adapter redis @nestjs/event-emitter` in `backend/`
- [x] T002 [P] Install frontend dependencies: `npm install socket.io-client` in `frontend/`
- [x] T003 Configure `EventEmitterModule` in `backend/src/app.module.ts`
- [x] T004 Setup `RedisIoAdapter` in `backend/src/common/redis/redis-io.adapter.ts` per research.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure and database schema updates

- [x] T005 Update Prisma schema with `Mission`, `UserMission`, `Trophy`, `ChatMessage`, `PvPMatch` in `backend/prisma/schema.prisma`
- [x] T006 Update `Card` model with `tier` and `category` enums in `backend/prisma/schema.prisma`
- [x] T007 Run prisma migration: `npx prisma migrate dev --name v2_entities` in `backend/`
- [ ] T008 [P] Create `SocketModule` and `BaseGateway` for shared WebSocket logic in `backend/src/modules/socket/`
- [ ] T009 [P] Update `RedisService` to support matchmaking queues in `backend/src/common/redis/redis.service.ts`

---

## Phase 3: User Story 4 - Balanced Stats & Tiers (Priority: P1)

**Goal**: Implement tier-based stat balancing and logarithmic scaling for cards.

**Independent Test**: Verify that cards generated from Wikipedia have stats normalized to game ranges (e.g., 10-100) and tiers (Common/Rare/SSR).

- [ ] T010 [US4] Implement `StatBalancer` utility in `backend/src/modules/card/utils/stat-balancer.ts` using formulas from research.md
- [ ] T011 [US4] Update `CardService.generateCardFromWiki` to use `StatBalancer` in `backend/src/modules/card/card.service.ts`
- [ ] T012 [US4] Update `refresh-cards.ts` script to populate tiers/categories for existing cards in `backend/scripts/refresh-cards.ts`
- [ ] T013 [US4] Frontend: Update Card component to display Tier (Color/Badge) and Category in `frontend/src/components/card.tsx`

---

## Phase 4: User Story 1 - Missions & Trophies (Priority: P1) 🎯 MVP

**Goal**: Implement a progression system with daily/lifetime missions and trophies.

**Independent Test**: Complete a "Pull 5 Cards" mission and verify rewards are claimed and trophies appear in profile.

- [ ] T014 [US1] Implement `MissionService` with event listeners for `card.pulled` and `battle.won` in `backend/src/modules/mission/mission.service.ts`
- [ ] T015 [US1] Implement `TrophyService` for achievement logic in `backend/src/modules/trophy/trophy.service.ts`
- [ ] T016 [US1] Create Mission and Trophy controllers in `backend/src/modules/mission/` and `backend/src/modules/trophy/`
- [ ] T017 [US1] Frontend: Implement `MissionList` component in `frontend/src/features/mission/components/mission-list.tsx`
- [ ] T018 [US1] Frontend: Implement `TrophyGrid` component in `frontend/src/features/trophy/components/trophy-grid.tsx`
- [ ] T019 [US1] Integrate Mission/Trophy progress into the main Dashboard in `frontend/src/App.tsx`

---

## Phase 5: User Story 2 - PvP System (Priority: P1)

**Goal**: Real-time matchmaking and battle resolution between players.

**Independent Test**: Two users join matchmaking, get paired, and see real-time battle logs ending in an ELO update.

- [ ] T020 [US2] Implement `PvPMatchmakingService` with Redis-based queue logic in `backend/src/modules/pvp/pvp-matchmaking.service.ts`
- [ ] T021 [US2] Implement `PvPGateway` for Socket.io events (`matchmaking.join`, `battle.step`) in `backend/src/modules/pvp/pvp.gateway.ts`
- [ ] T022 [US2] Update `BattleService` to support Elo calculation and detailed step logs in `backend/src/modules/battle/battle.service.ts`
- [ ] T023 [US2] Frontend: Create PvP Matchmaking UI with "Searching..." state in `frontend/src/features/pvp/components/matchmaking-overlay.tsx`
- [ ] T024 [US2] Frontend: Update Battle interface for real-time PvP log streaming in `frontend/src/features/battle/components/pvp-battle-view.tsx`

---

## Phase 6: User Story 3 - Category Counter System (Priority: P2)

**Goal**: Add strategic depth with elemental counters (e.g., Science > History).

**Independent Test**: Battle a "History" card with a "Science" card and verify the +20% ATK bonus in logs.

- [ ] T025 [US3] Implement `CategoryCounter` utility in `backend/src/modules/battle/utils/category-counter.ts`
- [ ] T026 [US3] Integrate `CategoryCounter` and Diminishing Returns Defense into `BattleService` battle resolution logic
- [ ] T027 [US3] Frontend: Add Category counter visual indicators (e.g., "History > Science") in `frontend/src/features/battle/components/battle-ui-hints.tsx`

---

## Phase 7: User Story 5 - Chat System (Priority: P3)

**Goal**: Global real-time chat for players.

**Independent Test**: Send a message in one tab and see it instantly appear in another user's chat window.

- [ ] T028 [US5] Implement `ChatGateway` for global broadcasting in `backend/src/modules/chat/chat.gateway.ts`
- [ ] T029 [US5] Implement `ChatService` for message persistence in `backend/src/modules/chat/chat.service.ts`
- [ ] T030 [US5] Frontend: Create `ChatSidebar` component with real-time updates in `frontend/src/features/chat/components/chat-sidebar.tsx`

---

## Phase N: Polish & Cross-Cutting Concerns

- [ ] T031 Update Swagger documentation for new REST endpoints in `backend/src/main.ts`
- [ ] T032 [P] Create E2E test for full PvP loop: `backend/test/pvp.e2e-spec.ts`
- [ ] T033 [P] Create E2E test for Mission completion: `backend/test/mission.e2e-spec.ts`
- [ ] T034 Perform final code cleanup and refactoring across all new modules

---

## Dependencies & Execution Order

1. **Setup (Phase 1)** -> **Foundational (Phase 2)** (Database & WebSockets)
2. **Phase 3 (Card Tiers)** -> Required for both Missions and PvP.
3. **Phase 4 (Missions)** & **Phase 5 (PvP)** can run in parallel after Phase 3.
4. **Phase 6 (Counter System)** -> Enhances Phase 5 (PvP).
5. **Phase 7 (Chat)** -> Independent social layer.
6. **Polish (Phase N)** -> Final validation.

### Parallel Opportunities

- T001, T002 (Dependency installs)
- T008, T009 (Gateway vs Redis logic)
- Once Phase 3 is done, Phase 4 (Missions) and Phase 5 (PvP) can be worked on by different developers.
- Frontend components (T017, T018, T023, T030) can be developed in parallel with backend services if contracts are respected.

---

## Implementation Strategy

### MVP Scope
- Phases 1, 2, 3, and 4.
- Delivers: Balanced cards and a functional Mission/Progression system.

### Incremental Delivery
- Add PvP (Phase 5) after the Mission system is stable.
- Add Counters (Phase 6) to deepen PvP strategy.
- Add Chat (Phase 7) as a final social feature.
