# wikigacha Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-11

## Active Technologies

- TypeScript (Node.js 20+) + React, Vite, Shadcn UI, Tailwind CSS (Frontend); 
- NestJS + Prisma (Backend), Wikipedia API (001-wikigacha-core)
- Database: MySql
- Deployment: Docker

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript (Node.js 20+): Follow standard conventions

## Basic settings

```
@./docs/coding-standards.md
@./docs/documentation-guideline.md
@./docs/git-workflow.md
@./docs/testing.md
@./docs/ux-ui-guideline.md
@./docs/mcp-management.md
```


## Recent Changes

- 001-wikigacha-core: Added TypeScript (Node.js 20+) + React, Vite, Shadcn UI, Tailwind CSS (Frontend); NestJS (Backend); Wikipedia API

## Required
<!-- MANUAL ADDITIONS START -->
- ALWAYS prioritize using the `context7` MCP server to fetch up-to-date library documentation and code examples before implementing features or fixing bugs. Do not use libraries with few stars or those that have not been updated for a long time.
- ALWAYS use the MySQL MCP server for direct database inspection and query validation when troubleshooting data-related issues.
<!-- MANUAL ADDITIONS END -->
