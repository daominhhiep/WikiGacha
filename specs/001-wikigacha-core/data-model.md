# Data Model: Wikigacha Core Gameplay

## Entities

### 1. Player
- `id`: String (UUID) - Primary Key
- `username`: String (Unique, 3-20 chars)
- `email`: String (Optional, for account recovery)
- `credits`: Integer (Default: 100) - Gacha currency
- `level`: Integer (Default: 1)
- `xp`: Integer (Default: 0)
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Relationships**:
- Has many `Inventory` (Cards in collection)
- Has many `BattleLog` (History of battles)

---

### 2. Card
- `id`: String (Wikipedia Page ID) - Primary Key
- `title`: String
- `summary`: Text
- `imageUrl`: String (Optional)
- `wikiUrl`: String
- `rarity`: Enum (COMMON, UNCOMMON, RARE, EPIC, LEGENDARY)
- `hp`: Integer
- `atk`: Integer
- `def`: Integer
- `pageViews`: Integer (Last 30 days)
- `languageCount`: Integer
- `createdAt`: DateTime

**Relationships**:
- Belongs to many `Inventory` entries

---

### 3. Inventory
- `id`: String (UUID) - Primary Key
- `playerId`: String (FK to Player.id)
- `cardId`: String (FK to Card.id)
- `acquiredAt`: DateTime
- `isFavorite`: Boolean (Default: false)

**Relationships**:
- Belongs to one `Player`
- Belongs to one `Card`

---

### 4. Battle
- `id`: String (UUID) - Primary Key
- `player1Id`: String (FK to Player.id)
- `player2Id`: String (Optional, for PvE/PvP)
- `winnerId`: String (Optional)
- `log`: JSON (Turn-by-turn battle record)
- `status`: Enum (PENDING, COMPLETED, CANCELLED)
- `createdAt`: DateTime

---

## State Transitions

### Pack Opening Flow:
1. Deduct Credits from `Player`.
2. Fetch random articles from Wikipedia.
3. Calculate stats/rarity for each article.
4. Upsert `Card` records in DB.
5. Create `Inventory` records for `Player`.
6. Return `Card` objects to frontend.

### Battle Flow:
1. Player selects deck (list of `Inventory.id`).
2. Server fetches stats for all selected cards.
3. Server executes auto-battle logic loop.
4. Server creates `Battle` record with `log`.
5. Server rewards `Player` with credits/XP.
6. Return `Battle` result and log to frontend.
