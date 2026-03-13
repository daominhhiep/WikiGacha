# Research: Wikigacha V2 Features

## Real-time Communication (Chat & PvP)

### Decision: Socket.io with Redis Adapter
- **Rationale**: Socket.io provides a robust, event-driven API for real-time communication. Using the Redis adapter allows the application to scale across multiple instances by broadcasting events through Redis Pub/Sub.
- **Alternatives Considered**: 
    - **Native WebSockets (ws)**: Faster and more lightweight, but requires manual implementation of rooms, heartbeats, and scaling logic.
    - **Pusher/Ably**: Managed services, but adds external dependency and cost.
- **Implementation**:
    - Use `@nestjs/platform-socket.io` and `socket.io-redis`.
    - Implement `SocketGateway` for handling events.

## PvP Matchmaking & Ranking

### Decision: Elo Rating System
- **Rationale**: Industry standard for calculating relative skill levels in zero-sum games. It's mathematically sound and easy to implement.
- **Algorithm**:
    - `ExpectedScore = 1 / (1 + 10^((RatingB - RatingA) / 400))`
    - `NewRating = Rating + K * (ActualScore - ExpectedScore)`
    - `K-Factor`: 32 (standard) or 40 for new players (< 10 matches).
- **Matchmaking**: 
    - Queue players in a Redis-backed waiting list.
    - Match players within a ±200 rating range, expanding by 50 every 5 seconds.

## Card Stat Balancing & Tiers

### Decision: Logarithmic Scaling + Normalization
- **Rationale**: Wikipedia metadata (page views, length) follows a power-law distribution. Direct mapping would create extreme power imbalances.
- **Formulas**:
    - **Scaling**: `Stat_raw = log10(WikipediaValue + 1)`
    - **Normalization**: `Stat_base = ((Stat_raw - Min_log) / (Max_log - Min_log)) * (Max_Game_Stat - Min_Game_Stat) + Min_Game_Stat`
    - **Tiers**:
        - **Common (C)**: 1.0x multiplier (Top 100%-30%)
        - **Rare (R)**: 1.2x multiplier (Top 30%-10%)
        - **Super Rare (SR)**: 1.5x multiplier (Top 10%-2%)
        - **Spec. Super Rare (SSR)**: 2.0x multiplier (Top 2%)

## Battle Engine Enhancements

### Decision: Category Counter & Diminishing Returns Defense
- **Categories**: 
    - **History** > **Science**
    - **Science** > **Geography**
    - **Geography** > **Art**
    - **Art** > **Entertainment**
    - **Entertainment** > **History**
    - *Counter Effect*: +20% ATK when advantaged.
- **Defense Formula**: `DamageTaken = RawDamage * (100 / (100 + DEF))`
    - This prevents invincibility and ensures linear Effective HP growth.

## Missions & Trophies

### Decision: Event-Driven Tracker
- **Rationale**: Decouples gameplay logic from mission progress.
- **Implementation**:
    - Use NestJS `EventEmitter2` to dispatch events (e.g., `card.pulled`, `battle.won`).
    - `MissionService` listens for events and updates user progress in MySQL.
