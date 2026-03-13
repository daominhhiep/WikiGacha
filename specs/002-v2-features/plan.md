# Implementation Plan: Wikigacha V2 Features

**Branch**: `002-v2-features` | **Date**: 2026-03-13 | **Spec**: [/specs/002-v2-features/spec.md]
**Input**: Feature specification from `/specs/002-v2-features/spec.md`

## Summary

Implement a comprehensive progression and social layer for Wikigacha, including Missions, Trophies, a real-time PvP system, a strategic Category Counter mechanic, balanced Card Tiers, and a Chat system. The technical approach involves extending the NestJS backend with new modules, implementing real-time communication using WebSockets (likely Socket.io), and enhancing the React frontend with new UI components and state management.

## Technical Context

**Language/Version**: TypeScript (Node.js 20+)
**Primary Dependencies**: NestJS, Prisma, React, Vite, Shadcn UI, Tailwind CSS, Redis, **Socket.io (NEEDS CLARIFICATION)**
**Storage**: MySQL (persistent), Redis (caching)
**Testing**: Jest (backend), Vitest (frontend)
**Target Platform**: Web
**Project Type**: Web application
**Performance Goals**: PvP matchmaking/resolution < 30s, Chat delivery < 1s
**Constraints**: Consistent design with V1, scalable WebSocket connections
**Scale/Scope**: 6 new core features/modules

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Code Quality**: Using NestJS + Prisma + TypeScript. No `any`.
- [x] **Testing Excellence**: Planning for Jest/Vitest coverage and E2E loops.
- [x] **UX/UI Consistency**: Using Shadcn UI + Tailwind CSS.
- [x] **Performance & Scalability**: Redis for caching, WebSockets for real-time.
- [x] **Documentation & Transparency**: Swagger for new APIs, updated `PROJECT_OVERVIEW.md`.

## Project Structure

### Documentation (this feature)

```text
specs/002-v2-features/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── modules/
│   │   ├── mission/      # New
│   │   ├── trophy/       # New
│   │   ├── pvp/          # New (WebSocket)
│   │   ├── chat/         # New (WebSocket)
│   │   ├── card/         # Updated (Tiers/Categories)
│   │   └── battle/       # Updated (Counter mechanics)
└── tests/

frontend/
├── src/
│   ├── features/
│   │   ├── mission/      # New
│   │   ├── trophy/       # New
│   │   ├── pvp/          # New
│   │   ├── chat/         # New
│   │   └── battle/       # Updated
└── tests/
```

**Structure Decision**: Following the established Web application structure with separate `backend/` and `frontend/` projects.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | | |
