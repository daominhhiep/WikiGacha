# Development Conventions

This document defines the general development conventions used across the Wikigacha project.  
It applies to both **Frontend and Backend** to ensure consistency, maintainability, and code quality.

---

# General Coding Style

### Formatting
- Use **2 spaces** for indentation
- Prefer **single quotes (`'`)** for strings
- Avoid using the **`any`** type whenever possible
- Use **clear and descriptive variable names**
- Keep functions small and focused on a single responsibility

### Code Quality
- Use **TypeScript strict mode**
- Always handle potential errors
- Avoid duplicated logic
- Prefer reusable utilities and shared modules

---

# Naming Conventions

### Variables and Functions
- Use **camelCase**

Example:
```typescript
const userInventory = []
function openGachaPack() {}
```

### Classes
- Use **PascalCase**

Example:
```typescript
class BattleService {}
```

### Files
- Use **kebab-case** for file names

Example:
```text
gacha-service.ts
battle-engine.ts
user-controller.ts
```

---

# Git Conventions

### Branch Naming
```text
feature/<feature-name>
fix/<bug-name>
chore/<task-name>
```

Examples:
```text
feature/gacha-system
feature/deck-builder
fix/battle-calculation
```

### Commit Messages

Use clear commit messages:
```text
feat: implement gacha pack system
fix: resolve deck validation bug
chore: update dependencies
```

---

# Backend Conventions (NestJS)

### Structure
- Follow **feature-based module structure**

Example:
```text
src/modules
auth
users
cards
gacha
decks
battle
```

### Services
- Business logic must be implemented inside **services**
- Controllers should only handle request/response

### Validation
- Use **DTO classes**
- Use **class-validator**

Example:
```typescript
CreateDeckDto
OpenPackDto
```

### Error Handling
- Always use **NestJS exception classes**

Example:
```typescript
throw new BadRequestException('Invalid deck')
```

---

# Frontend Conventions (React)

### Component Rules

- Component files must use `.tsx`
- Component names use **PascalCase**
- Components should be exported using **default export**
- Each component must define its **TypeScript interface**

Example:
```typescript
interface CardProps {
    name: string
    rarity: string
}

export default function Card({ name, rarity }: CardProps) {
  return <div>{name}</div>
}
```

---

# Styling Rules

- Use **Tailwind CSS**
- Follow **mobile-first responsive design**
- Support **dark mode**
- Use **CSS variables** for theme colors

Example:
```
bg-primary text-white dark:bg-gray-900
```

---

# State Management

### Asynchronous Data

Use **React Query** for:

- API calls
- caching
- background refetching

Example:
```typescript
useQuery(['cards'], fetchCards)
```

### Form Handling

Use:

- **react-hook-form**
- **zod** for schema validation

Example:
```typescript
const form = useForm({
  resolver: zodResolver(schema)
})
```

---

# Testing Requirements

### Backend

Testing framework:

- Jest
- Supertest

Tests must include:

- API endpoint tests
- service logic tests
- integration tests

---

### Frontend

Testing tools:

- React Testing Library
- Jest

Requirements:

- Every component must have **unit tests**
- Test **user interactions**
- Minimum **80% test coverage**

Example test file:
```text
card.test.tsx
deck-builder.test.tsx
```

---

# Documentation

- Important functions must include **JSDoc comments**

Example:
```typescript
/**

Open a gacha pack and return generated cards
*/
function openPack(userId: string) {}

```

- Document APIs with **Swagger (backend)**

---

# Error Handling

All API calls must include proper error handling.

Example:
```typescript
try {
  await openPack()
} catch (error) {
  console.error(error)
}
```

---

# Logging

Application logs should be exported to:
```text
./server.log
```

Logs include:

- API errors
- gameplay events
- system warnings

---

# Security Best Practices

- Validate all inputs
- Never expose secrets in frontend
- Store sensitive configs in `.env`
- Use authentication middleware for protected APIs

---

# Development Workflow

Recommended workflow:

1. Create feature branch
2. Implement feature
3. Write tests
4. Run lint and tests
5. Commit changes
6. Create pull request

---

# Code Review Guidelines

During code review ensure:

- Code follows project conventions
- No unnecessary complexity
- Proper error handling exists
- Tests are included
- Documentation is updated
- Dont use any 'type'