# API Contracts: Wikigacha V2 Features

## REST API (Missions & Trophies)

### GET /missions
- **Response**: `200 OK`, `UserMission[]`
- **Description**: Fetch all missions for the current user and their progress.

### POST /missions/:id/claim
- **Response**: `200 OK`, `{ creditsClaimed: Int, newBalance: Int }`
- **Description**: Claim rewards for a completed mission.

### GET /trophies
- **Response**: `200 OK`, `Trophy[]`
- **Description**: Fetch all trophies unlocked by the current user.

## WebSocket API (Chat & PvP)

### Namespace: `/chat`

#### Event: `message.send` (C->S)
- **Payload**: `{ content: String, channel: String }`
- **Response**: Ack with `ChatMessage` object.

#### Event: `message.receive` (S->C)
- **Payload**: `ChatMessage` object.

### Namespace: `/pvp`

#### Event: `matchmaking.join` (C->S)
- **Payload**: `{ deckId: Int }`
- **Description**: Join the PvP matchmaking queue.

#### Event: `matchmaking.status` (S->C)
- **Payload**: `{ status: "SEARCHING" | "MATCHED", matchId?: String, opponent?: PublicUser }`
- **Description**: Sent when status changes.

#### Event: `battle.start` (S->C)
- **Payload**: `{ matchId: String, player1: BattleTeam, player2: BattleTeam }`
- **Description**: Sent when both players are ready.

#### Event: `battle.step` (S->C)
- **Payload**: `{ step: Int, action: BattleAction, result: BattleResult }`
- **Description**: Real-time battle updates.

#### Event: `battle.end` (S->C)
- **Payload**: `{ winnerId: Int, reward: Reward, eloChange: Int }`
- **Description**: Final result of the match.
