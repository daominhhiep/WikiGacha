# Implementation Plan: Wikigacha Core Gameplay

**Branch**: `001-wikigacha-core` | **Date**: 2026-03-11 | **Spec**: [/specs/001-wikigacha-core/spec.md](../spec.md)
**Input**: Feature specification from `/specs/001-wikigacha-core/spec.md`

## Summary

Wikigacha is a web-based gacha game where players collect and battle cards derived from Wikipedia articles. The core gameplay includes opening card packs (fetching random Wikipedia data), managing a collection, and engaging in PvE auto-battles. The technical approach involves a NestJS backend for card generation and battle logic, a React frontend for the gacha experience, and MySQL for persisting player progress.

## Technical Context

**Language/Version**: TypeScript (Node.js 20+)  
**Primary Dependencies**: React, Vite, Shadcn UI, Tailwind CSS (Frontend); NestJS (Backend); Wikipedia API  
**Storage**: MySQL (Main DB), Redis (Caching)  
**Testing**: Vitest (Frontend), Jest (Backend)  
**Target Platform**: Docker (Web)
**Project Type**: Web Application (Fullstack)  
**Performance Goals**: SC-001 < 3s pack opening, < 200ms API latency.  
**Constraints**: Wikipedia User-Agent with contact info required.  
**Scale/Scope**: Initial MVP for 100 concurrent users.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Fullstack architecture aligns with project goals.
- [x] Tech stack (React/NestJS/MySQL) is standard and well-supported.
- [x] Constitution (Template) followed.
- [x] Research.md resolves all technical unknowns.
- [x] Data model and API contracts align with requirements.


## Project Structure

### Documentation (this feature)

```text
specs/001-wikigacha-core/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (generated later)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── modules/
│   │   ├── card/        # Card generation & Wikipedia integration
│   │   ├── collection/  # Inventory management
│   │   ├── battle/      # Auto-battle engine
│   │   └── auth/        # JWT/Guest auth
│   ├── models/          # TypeORM/Prisma entities
│   └── common/
└── tests/

frontend/
├── src/
│   ├── components/      # UI components (Shadcn)
│   ├── features/
│   │   ├── gacha/       # Pack opening UI
│   │   ├── collection/  # Collection viewer
│   │   └── battle/      # Battle visualizer
│   ├── services/        # API clients
│   └── hooks/
└── tests/

docker/
├── docker-compose.yml
└── Dockerfile
```

**Structure Decision**: Monorepo approach with `frontend/` and `backend/` directories to separate concerns while keeping the project unified.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A       | N/A        | N/A                                 |
