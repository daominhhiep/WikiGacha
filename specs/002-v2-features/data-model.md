# Data Model: Wikigacha V2 Features

## Entities

### User (Extended)
- `eloRating`: Int (default 1200)
- `matchesPlayed`: Int (default 0)
- `lastLogin`: DateTime
- `trophies`: Relation(Trophy[])
- `missions`: Relation(UserMission[])

### Card (Updated)
- `tier`: Enum (COMMON, RARE, SUPER_RARE, SPEC_SUPER_RARE)
- `category`: Enum (HISTORY, SCIENCE, ART, GEOGRAPHY, ENTERTAINMENT)
- `atk`: Int
- `def`: Int
- `hp`: Int

### Mission
- `id`: Int (PK)
- `title`: String
- `description`: String
- `rewardCredits`: Int
- `type`: Enum (DAILY, LIFETIME)
- `criteria`: JSON (e.g., `{ type: "PULL_CARDS", count: 10 }`)

### UserMission
- `id`: Int (PK)
- `userId`: Int (FK)
- `missionId`: Int (FK)
- `progress`: Int
- `isCompleted`: Boolean
- `isClaimed`: Boolean

### Trophy
- `id`: Int (PK)
- `name`: String
- `description`: String
- `icon`: String
- `userId`: Int (FK)
- `unlockedAt`: DateTime

### ChatMessage
- `id`: Int (PK)
- `senderId`: Int (FK)
- `content`: String
- `timestamp`: DateTime
- `channel`: String (e.g., "GLOBAL")

### PvPMatch
- `id`: String (PK, UUID)
- `player1Id`: Int (FK)
- `player2Id`: Int (FK)
- `status`: Enum (MATCHMAKING, IN_PROGRESS, COMPLETED)
- `winnerId`: Int (FK, Nullable)
- `logs`: JSON (detailed battle steps)
- `createdAt`: DateTime

## Relationships
- User 1:M UserMission
- User 1:M Trophy
- User 1:M ChatMessage
- User 1:M PvPMatch (as player1 or player2)
- Mission 1:M UserMission
