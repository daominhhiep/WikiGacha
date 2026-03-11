# Testing Guide

This guide covers the testing approach and test suite for the Wikigacha Backend project.

The backend is built with NestJS and Prisma and exposes REST APIs used by the frontend game client.

---

# Test Structure

The project uses **Jest** for testing with the following structure:
```
tests/
├── setup.ts
├── test_auth.e2e-spec.ts
├── test_users.e2e-spec.ts
├── test_cards.e2e-spec.ts
├── test_gacha.e2e-spec.ts
├── test_decks.e2e-spec.ts
├── test_battle.e2e-spec.ts
├── test_wikipedia_integration.e2e-spec.ts
└── test_game_workflow.e2e-spec.ts
```


---

# Test Configuration

## Test Database Setup

Tests use a separate MySQL test database.

Example environment:
`DATABASE_URL="mysql://mysql:password@localhost:3306/wikigacha_test"`


Before running tests:

- Prisma migrations are applied
- Database tables are created automatically

---

# Test Fixtures

Common test utilities include:

**setupTestApp**
- Initializes NestJS testing module

**testClient**
- HTTP client for calling API endpoints

**testDatabase**
- Resets database before each test

Example:
```typescript
beforeEach(async () => {
  await prisma.user.deleteMany()
  await prisma.card.deleteMany()
})
```

---

# Running Tests

## Run All Tests
`npm run test`

## Run End-to-End Tests
`npm run test:e2e`

## Run Specific Test File
`npm run test:e2e -- test_gacha.e2e-spec.ts`

## Run Tests with Coverage
`npm run test:cov`


---

# Test Categories

## 1. API Endpoint Tests

These tests verify CRUD operations for core APIs.

---

### User Tests (test_users.e2e-spec.ts)

Tests include:

- Create user
- Get user profile
- Update user
- Authentication validation

---

### Card Tests (test_cards.e2e-spec.ts)

Tests include:

- Fetch cards
- Fetch card by ID
- Search cards
- Validate card metadata

---

### Gacha Tests (test_gacha.e2e-spec.ts)

Tests include:

- Open gacha pack
- Validate card rewards
- Verify drop rate logic
- Pack cooldown validation

---

### Deck Tests (test_decks.e2e-spec.ts)

Tests include:

- Create deck
- Add card to deck
- Remove card from deck
- Validate deck rules

---

### Battle Tests (test_battle.e2e-spec.ts)

Tests include:

- Start PvP battle
- Simulate battle rounds
- Validate battle results
- Store battle history

---

# 2. Integration Tests

Integration tests verify full gameplay workflows.

---

## Wikipedia Integration Tests (test_wikipedia_integration.e2e-spec.ts)

These tests verify that the system correctly integrates with the Wikipedia API.

Tests include:

- Fetch article metadata
- Transform article into card data
- Validate generated stats

Example validation:
```typescript
  expect(card.atk).toBeGreaterThan(0)
  expect(card.def).toBeGreaterThan(0)
```


---

## Game Workflow Tests (test_game_workflow.e2e-spec.ts)

Tests the complete player gameplay flow:

1. Create user
2. Open gacha pack
3. Add cards to inventory
4. Create deck
5. Start battle
6. Validate battle results

---

# Test Examples

## Basic API Test Example
```typescript
it('should open a gacha pack', async () => {
  const response = await request(app.getHttpServer())
    .post('/gacha/open-pack')
    .send({ userId })

  expect(response.status).toBe(201)
  expect(response.body.cards.length).toBe(5)
})
```

---

## Integration Test Example
```typescript
it('should complete full gameplay workflow', async () => {

  const user = await createTestUser()

  const pack = await openTestPack(user.id)

  const deck = await createTestDeck(user.id, pack.cards)

  const battle = await startTestBattle(deck.id)

  expect(battle.result).toBeDefined()

})
```


---

# Test Database

## Isolated Test Environment

Tests use a dedicated database to ensure:

- clean test environment
- no data conflicts
- reproducible results

Before each test:
```typescript
await prisma.$transaction([
    prisma.user.deleteMany(),
    prisma.card.deleteMany(),
    prisma.deck.deleteMany()
])
```

---

# Mocking and External Dependencies

## Wikipedia API

For integration tests:

- API responses may be mocked
- avoids external network dependency
- ensures deterministic tests

Example mock:
```typescript
jest.spyOn(wikipediaService, 'fetchArticle')
.mockResolvedValue(mockArticle)
```

---

# Test Data Management

## Test Isolation

Each test runs independently:

- database reset before tests
- no shared state
- predictable outcomes

## Test Data Creation

Tests create minimal data needed:

- test users
- test cards
- test decks

Example:
```typescript
const user = await prisma.user.create({
    data: { email: "test@example.com" }
})
```

---

# Running Tests in Development

## Watch Mode
`npm run test:watch`

## Run Specific Test
`npm run test -- test_gacha.e2e-spec.ts`

---

# Test Performance

## Fast Test Execution

- optimized database operations
- minimal test data
- mocked external APIs

---

# Debugging Tests

## Debug Failed Tests
`npm run test -- --verbose`

## Run Single Test
`npm run test -- test_gacha.e2e-spec.ts`

---

# Test Coverage

Generate coverage reports:
`npm run test:cov`

Coverage focuses on:

- gacha logic
- deck validation
- battle simulation
- API error handling

---

# Continuous Integration

Tests run automatically in CI environments such as GitHub Actions.

CI pipeline:

- install dependencies
- run migrations
- execute tests
- generate coverage reports

---

# Best Practices

## Test Organization

- group tests by feature
- use descriptive test names
- keep tests independent

## Test Quality

- test success and failure scenarios
- validate edge cases
- ensure data integrity

## Test Maintenance

- update tests when APIs change
- remove obsolete tests
- refactor duplicated test logic
