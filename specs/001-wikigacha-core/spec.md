# Feature Specification: Wikigacha Core Gameplay

**Feature Branch**: `001-wikigacha-core`  
**Created**: 2026-03-11  
**Status**: Draft  
**Input**: User description: "Wikigacha is a web gacha game where players open packs to collect and battle using cards created from Wikipedia articles."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open Card Packs (Priority: P1)

As a new or returning player, I want to open a "Wikipedia Pack" to receive a set of cards based on random or themed Wikipedia articles so that I can build my collection.

**Why this priority**: This is the core "gacha" mechanic and the primary way players interact with the unique Wikipedia-based card generation.

**Independent Test**: Can be fully tested by triggering a "Pack Opening" action, which fetches Wikipedia data and displays at least 5 new cards in the player's inventory.

**Acceptance Scenarios**:

1. **Given** the player has enough currency, **When** they select "Open Pack", **Then** the system should fetch random Wikipedia articles and generate cards with unique stats.
2. **Given** a pack is opened, **When** the cards are revealed, **Then** they should be automatically added to the player's permanent collection.

---

### User Story 2 - View and Manage Collection (Priority: P1)

As a player, I want to browse my collected Wikipedia cards, viewing their artwork (from Wikipedia), stats, and the original article summary so that I can learn about the topics and plan my battle deck.

**Why this priority**: Essential for the "collecting" aspect of the game and provides the educational/discovery value of using Wikipedia.

**Independent Test**: Can be tested by navigating to the "Collection" screen and verifying that all previously "pulled" cards are visible with their respective Wikipedia data.

**Acceptance Scenarios**:

1. **Given** the player has collected cards, **When** they open the Collection view, **Then** they should see a grid of cards with titles and images from Wikipedia.
2. **Given** a specific card is selected, **When** viewed in detail, **Then** the system should display a brief summary from the Wikipedia article.

---

### User Story 3 - Battle with Wikipedia Cards (Priority: P2)

As a player, I want to select a team of cards from my collection to battle against an opponent (AI or other player) using stats derived from the Wikipedia articles to earn rewards.

**Why this priority**: Provides a "reason to play" and a loop for using the collected cards, though the game's primary hook is the collecting itself.

**Independent Test**: Can be tested by entering a "Battle" mode with a selected deck and completing a match where card stats (HP, Attack) are used to determine a winner.

**Acceptance Scenarios**:

1. **Given** a player has a deck of cards, **When** they start a battle, **Then** the **Auto-Battle** system should resolve based on card stats.
2. **Given** a battle is won, **When** the match ends, **Then** the player should receive currency to buy more packs.

---

### Edge Cases

- **Article with no images**: How does the system handle a Wikipedia article that has no usable images for the card art? (Assumption: Use a placeholder "Wikipedia Logo" or generic category icon).
- **Extremely long/short articles**: How are stats balanced for a 50,000-word article vs. a 100-word stub? (Assumption: Use logarithmic scaling or caps for stats).
- **Wikipedia API Downtime**: How does the game handle a failure to fetch new articles during pack opening? (Assumption: Show a friendly error and refund currency).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST fetch random or featured articles from Wikipedia using their API.
- **FR-002**: System MUST convert Wikipedia article data (Title, Summary, Image, Length, Links) into game card attributes.
- **FR-003**: System MUST provide a "Gacha" interface for opening packs with visual feedback.
- **FR-004**: System MUST persist player card collections and currency state.
- **FR-005**: System MUST implement an **Auto-Battle** engine where cards interact based on their derived stats.
- **FR-006**: System MUST derive card "Power" or "Rarity" from **Wikipedia popularity (e.g., page views or number of languages)**.
- **FR-007**: System MUST support **PvE focus** for battles where players compete against AI opponents.

### Key Entities *(include if feature involves data)*

- **Card**: Represents a Wikipedia article. Attributes: Wikipedia ID, Title, Summary, Image URL, Stats (HP, ATK, DEF), Rarity.
- **Player**: Represents the user. Attributes: Inventory (List of Cards), Currency (Gacha Credits), Level/XP.
- **Pack**: A bundle of cards with defined probabilities for different rarities.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can open a pack and see their new cards in under 3 seconds (excluding API latency).
- **SC-002**: 100% of cards generated must link back to their original Wikipedia article for verification.
- **SC-003**: Players can complete a basic battle loop (Select Deck -> Battle -> Result) in under 5 minutes.
- **SC-004**: System handles at least 10 concurrent Wikipedia API requests per second during peak "pull" events.
