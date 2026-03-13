<!--
Sync Impact Report:
- Version change: 0.0.0 → 1.0.0
- List of modified principles:
    - [PRINCIPLE_1_NAME] → I. Code Quality & Standards
    - [PRINCIPLE_2_NAME] → II. Testing Excellence
    - [PRINCIPLE_3_NAME] → III. UX/UI Consistency
    - [PRINCIPLE_4_NAME] → IV. Performance & Scalability
    - [PRINCIPLE_5_NAME] → V. Documentation & Transparency
- Added sections: Technical Constraints, Development Workflow
- Removed sections: None
- Templates requiring updates: 
    - ✅ .specify/templates/plan-template.md (verified alignment)
    - ✅ .specify/templates/spec-template.md (verified alignment)
    - ✅ .specify/templates/tasks-template.md (verified alignment)
- Follow-up TODOs: None
-->

# Wikigacha Constitution

## Core Principles

### I. Code Quality & Standards
Every piece of code MUST adhere to TypeScript (Node.js 20+) standards. Use Prisma for ORM and NestJS for backend. Avoid `any` types. Follow DRY and SOLID principles. Maintain clean architecture with separate modules for Auth, Gacha, Collection, and Battle. All code must be linted and formatted according to project rules.

### II. Testing Excellence
Mandatory test coverage for all new features. Write unit tests for services/controllers and E2E tests for core game loops. Reproduce bugs with test cases before fixing. Use Jest for backend and Vitest for frontend. A feature is not complete until its behavioral correctness is verified by automated tests.

### III. UX/UI Consistency
UI MUST be visually appealing, responsive, and follow the established design language (Shadcn UI + Tailwind CSS). Ensure consistent spacing, typography, and interactive feedback. Prioritize user-friendly flows for gacha opening and battle simulation. The application should feel "alive" and polished.

### IV. Performance & Scalability
Optimize Wikipedia API calls and database queries. Use Redis for caching frequently accessed data (e.g., card metadata). Ensure the battle engine can handle concurrent simulations efficiently. Minimize bundle size and optimize asset loading for a fast frontend experience.

### V. Documentation & Transparency
All APIs MUST be documented with Swagger. Maintain an up-to-date `PROJECT_OVERVIEW.md`. Use `GEMINI.md` for specific module instructions. Document non-obvious logic and architectural decisions. Code should be self-documenting where possible, but complex business logic requires clear comments.

## Technical Constraints

- **Backend**: NestJS, Prisma ORM, Node.js 20+.
- **Frontend**: React, Vite, Shadcn UI, Tailwind CSS.
- **Database**: MySQL (persistent), Redis (caching).
- **External Data**: Wikipedia MediaWiki API.
- **Environment**: Strict separation of concerns, `.env` for configuration.

## Development Workflow

- **Research First**: Always map the codebase and validate assumptions before coding.
- **Test-Driven**: Reproduce bugs with tests; verify features with new test cases.
- **Tool Usage**: Leverage MCP servers (context7, mysql, github) for up-to-date docs and direct DB/Git interaction.
- **No Manual Commits**: Do not stage or commit changes unless explicitly requested.
- **Validation**: All changes must pass linting, type-checking, and tests.

## Governance

This constitution supersedes all other practices and takes precedence over individual `GEMINI.md` files for global standards. All pull requests and code reviews must verify compliance with these principles. Complexity must be justified if it violates any core principle. Amendments to this constitution require a version bump (MAJOR/MINOR/PATCH) and an updated Sync Impact Report.

**Version**: 1.0.0 | **Ratified**: 2026-03-13 | **Last Amended**: 2026-03-13
