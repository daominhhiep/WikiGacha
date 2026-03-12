# CLAUDE.md - Wikigacha Project

## Project Overview
Wikigacha is a Wikipedia-based gacha game. Each Wikipedia article is a collectible card.
- **Frontend**: React + Vite + Shadcn UI + Tailwind CSS.
- **Backend**: NestJS + Prisma + MySQL + Redis.
- **External API**: Wikipedia (MediaWiki) API.

## Coding Standards
- **Language**: TypeScript (Node.js 20+).
- **Style**: Standard TypeScript conventions, Prettier for formatting.
- **Architecture**: Separated UI components and business logic. NestJS modules for backend logic.
- **Error Handling**: Comprehensive error handling in both frontend and backend.
- **API Documentation**: Swagger for REST APIs.

## Commands
### Global
- `npm run lint`
- `npm test`

### Backend
- `cd backend && npm run build`
- `cd backend && npm run start:dev`
- `cd backend && npx prisma generate`
- `cd backend && npm test`
- `cd backend && npm run test:e2e`

### Frontend
- `cd frontend && npm run dev`
- `cd frontend && npm run build`
- `cd frontend && npm test`

## Pull Request Review Guidelines
- Verify security best practices (e.g., no secrets in code).
- Ensure new features have corresponding tests.
- Check for architectural consistency with existing modules.
- Maintain responsive and user-friendly UI.

