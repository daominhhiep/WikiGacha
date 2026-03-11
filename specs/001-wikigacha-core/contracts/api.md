# API Contracts: Wikigacha Core Gameplay

## Base URL: `/api/v1`

### 1. Authentication

#### `POST /auth/guest`
- **Description**: Create a new guest account or resume existing session.
- **Request**: `{ username?: string }`
- **Response**: `{ player: Player, accessToken: string }`

---

### 2. Gacha (Packs)

#### `POST /gacha/open`
- **Description**: Spend credits to open a pack and receive new cards.
- **Request**: `{ packType: 'BASIC' | 'THEMED' }`
- **Response**: `{ newCards: Card[], remainingCredits: number }`

---

### 3. Collection

#### `GET /collection`
- **Description**: Retrieve the player's current card inventory.
- **Request**: `?page=1&limit=20`
- **Response**: `{ items: Inventory[], total: number }`

#### `GET /collection/:id`
- **Description**: Get detailed stats and Wikipedia info for a specific card in inventory.
- **Response**: `Inventory & { card: Card }`

---

### 4. Battle

#### `POST /battle/start`
- **Description**: Start an auto-battle with a selected deck.
- **Request**: `{ deckIds: string[], opponentId?: string }` (If no `opponentId`, PvE starts).
- **Response**: 
  ```json
  {
    "battleId": "uuid",
    "winnerId": "uuid",
    "log": [
      { "turn": 1, "attacker": "uuid", "defender": "uuid", "damage": 25, "hpRemaining": 75 },
      { "turn": 2, "attacker": "uuid", "defender": "uuid", "damage": 10, "hpRemaining": 90 }
    ],
    "rewards": { "credits": 50, "xp": 100 }
  }
  ```

#### `GET /battle/history`
- **Description**: Get a list of past battles.
- **Response**: `Battle[]`
