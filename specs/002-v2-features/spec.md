# Feature Specification: Wikigacha V2 Features

**Feature Branch**: `002-v2-features`  
**Created**: 2026-03-13  
**Status**: Draft  
**Input**: User description: "mission, Trophies, pvp system, category system counter card, balance of atk,def,hp tier card, chat system"

## User Scenarios & Testing

### User Story 1 - Missions & Trophies (Priority: P1)

As a player, I want to complete daily and lifetime missions to earn rewards and trophies so that I have a sense of progression.

### User Story 2 - PvP System (Priority: P1)

As a player, I want to battle against other players using my decks to prove my skills and climb the leaderboard.

### User Story 3 - Category Counter System (Priority: P2)

As a player, I want cards to have "Categories" (e.g., History, Science) that counter each other (e.g., Science counters History) so that there's more strategy in deck building.

### User Story 4 - Balanced Stats & Tiers (Priority: P2)

As a player, I want cards to have balanced ATK/DEF/HP based on their "Tier" (Common, Rare, Legendary) so that higher-tier cards are generally stronger but still fair.

### User Story 5 - Chat System (Priority: P3)

As a player, I want to chat with other players in a global or room-based chat system to socialize and share tips.

## Requirements

### Functional Requirements

- **FR-001**: Mission system with daily and one-time tasks.
- **FR-002**: Trophy system to track achievements and display them in the profile.
- **FR-003**: PvP matchmaking and battle resolution.
- **FR-004**: Category-based counter mechanics in the battle engine.
- **FR-005**: Tier-based stat balancing for cards.
- **FR-006**: Real-time chat system (Global/Private).

### Key Entities

- **Mission**: Title, description, reward, status (pending, completed, claimed).
- **Trophy**: Name, criteria, unlock date.
- **PvPMatch**: Players, status, winner, logs.
- **Category**: Name, counter list (e.g., Science > History).
- **ChatMessage**: Sender, receiver, content, timestamp.

## Success Criteria

- **SC-001**: Players can complete missions and see rewards immediately.
- **SC-002**: PvP matches are matched and resolved within 30 seconds.
- **SC-003**: Chat messages are delivered in under 1 second.
