# Tasks: Wikigacha Core Gameplay

**Input**: Design documents from `/specs/001-wikigacha-core/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Technical plan specifies Vitest (Frontend) and Jest (Backend). Tasks include test setup and story-specific tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create monorepo structure with `backend/` and `frontend/` per implementation plan
- [x] T002 Initialize NestJS project in `backend/` with Prisma 7 and MySQL dependencies
- [x] T003 Initialize React + Vite + Tailwind + Shadcn project in `frontend/`
- [x] T004 [P] Configure Shared Docker environment in `docker/docker-compose.yml` and `Dockerfile`
- [x] T005 [P] Setup ESLint and Prettier across both projects

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T006 Initialize Prisma schema and connection to MySQL in `backend/prisma/schema.prisma`
- [x] T007 Implement Base Player Entity and Auth Service (Guest Auth) in `backend/src/modules/auth/`
- [x] T008 [P] Setup Redis client for caching in backend/src/common/redis.service.ts
- [x] T009 [P] Create API response wrappers and global error filter in `backend/src/common/`
- [x] T010 Setup Frontend API client (Axios/Fetch) with Interceptors in `frontend/src/services/api.ts`
- [x] T011 [P] Implement Basic Layout and Navigation in `frontend/src/components/layout/`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Open Card Packs (Priority: P1) 🎯 MVP

**Goal**: Players can spend credits to open packs and receive cards from Wikipedia.

**Independent Test**: Trigger "Open Pack" via UI or API, verify 5 cards are added to DB and displayed with Wikipedia content.

### Tests for User Story 1
- [x] T012 [P] [US1] Unit test for Wikipedia API Client in `backend/src/modules/card/wiki.service.spec.ts`
- [x] T013 [US1] Integration test for Pack Opening flow in `backend/test/gacha.e2e-spec.ts`
- [x] T014 [P] [US1] Component test for Gacha reveal animation in `frontend/src/features/gacha/GachaReveal.test.tsx`

### Implementation for User Story 1
- [x] T015 [P] [US1] Implement Wikipedia API Client (Random/Summary) in `backend/src/modules/card/wiki.service.ts`
- [x] T016 [US1] Implement Card Generation Logic (Stats/Rarity derivation) in `backend/src/modules/card/card.service.ts`
- [x] T017 [US1] Implement Gacha Controller and `POST /gacha/open` in `backend/src/modules/card/card.controller.ts`
- [x] T018 [P] [US1] Create Gacha Store/Hook for state management in `frontend/src/features/gacha/useGacha.ts`
- [x] T019 [US1] Implement Pack Opening UI with Shadcn components in `frontend/src/features/gacha/GachaPage.tsx`
- [x] T020 [US1] Add Wikipedia attribution and links to Card components in `frontend/src/components/Card.tsx`

**Checkpoint**: User Story 1 is functional. Packs can be opened and cards saved.

---

## Phase 4: User Story 2 - View and Manage Collection (Priority: P1)

**Goal**: Players can browse their collected cards and view details.

**Independent Test**: Navigate to Collection view, see all cards owned by the player, click one to see full Wikipedia summary.

### Tests for User Story 2
- [x] T021 [P] [US2] Unit test for Inventory service in `backend/src/modules/collection/collection.service.spec.ts`
- [x] T022 [US2] Integration test for `GET /collection` in `backend/test/collection.e2e-spec.ts`

### Implementation for User Story 2
- [x] T023 [P] [US2] Implement Inventory Service to fetch player cards in `backend/src/modules/collection/collection.service.ts`
- [x] T024 [US2] Implement Collection Controller and `GET /collection` in `backend/src/modules/collection/collection.controller.ts`
- [x] T025 [P] [US2] Create Collection Grid component in `frontend/src/features/collection/CollectionGrid.tsx`
- [x] T026 [US2] Implement Card Detail Modal with Wikipedia summary in `frontend/src/features/collection/CardDetail.tsx`
- [x] T027 [US2] Add filtering/sorting by rarity in `frontend/src/features/collection/CollectionFilters.tsx`

**Checkpoint**: User Story 2 is functional. Collection can be browsed and managed.

---

## Phase 5: User Story 3 - Battle with Wikipedia Cards (Priority: P2)

**Goal**: Players can select a team and engage in an auto-battle against AI.

**Independent Test**: Select 3 cards, start battle, watch logs/animation, verify winner and reward distribution.

### Tests for User Story 3
- [x] T028 [P] [US3] Unit test for Auto-Battle Engine logic in `backend/src/modules/battle/battle-engine.spec.ts`
- [x] T029 [US3] Integration test for Battle flow and rewards in `backend/test/battle.e2e-spec.ts`

### Implementation for User Story 3
- [x] T030 [US3] Implement Auto-Battle Engine (Turn-based simulation) in `backend/src/modules/battle/battle-engine.ts`
- [x] T031 [US3] Implement Battle Service (State management, rewards) in `backend/src/modules/battle/battle.service.ts`
- [x] T032 [US3] Implement Battle Controller and `POST /battle/start` in `backend/src/modules/battle/battle.controller.ts`
- [x] T033 [P] [US3] Create Battle Deck Selection UI in `frontend/src/features/battle/DeckSelector.tsx`
- [x] T034 [US3] Implement Battle Visualizer (Log playback) in `frontend/src/features/battle/BattleArena.tsx`
- [x] T035 [US3] Add Battle Result screen with reward animation in `frontend/src/features/battle/BattleResult.tsx`

**Checkpoint**: All user stories functional. Core loop complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements and verification.

- [x] T036 [P] Implement Redis caching for Card Pool metadata in `backend/src/modules/card/card.service.ts`
- [x] T037 Add Loading States and Skeletons across all features in `frontend/src/components/ui/`
- [x] T038 Performance audit of Wikipedia card generation (target SC-001)
- [x] T039 [P] Final Documentation update in `README.md` and `quickstart.md`
- [ ] T040 Run full E2E validation of the "Pull -> View -> Battle" loop

---

## Dependencies & Execution Order

### Phase Dependencies
- Phase 1 & 2 are STRICT PREREQUISITES.
- Phase 3 (US1) is the MVP and should be completed first.
- Phase 4 (US2) and Phase 5 (US3) depend on Phase 3 (need cards to view/battle).

### Parallel Opportunities
- T004, T005 (Docker/Linting)
- T008, T009 (Redis/Error Handling)
- Once backend services are defined (T015-T017), Frontend work (T018-T020) can proceed in parallel.
- All Story-specific tests ([P] [USx]) can be written in parallel before implementation.

---

## Implementation Strategy

### MVP First (User Story 1 & 2)
1. Setup Monorepo + Foundation (Phases 1-2).
2. Implement Gacha / Pack Opening (Phase 3).
3. Implement Collection View (Phase 4).
4. **Validation**: Can I pull a card and see it? If yes, MVP is ready.

### Incremental Delivery
- Add Battle system (Phase 5) once the collection is stable.
- Add Polish (Phase 6) last to optimize performance and UX.
