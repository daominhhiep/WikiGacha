## Overview
This project is the backend service for a game inspired by Wikigacha, where each collectible card represents a Wikipedia article.  
The system automatically converts Wikipedia data into playable cards and allows users to open gacha packs, collect cards, build decks, and battle with other players.

## Concept
* Each Wikipedia article becomes a **card** in the game
* Each card contains stats generated from Wikipedia metadata (page views, article length, etc.)
* Users open **gacha packs** to obtain random cards
* Users store cards in their **inventory** and build **decks**
* Decks are used to perform **PvP battles**

## How it works
* Backend fetches article data from Wikipedia API
* A card generator transforms article metadata into card stats
* Cards are stored in the database
* When a user opens a pack, the system randomly selects cards from the card pool
* Cards are added to the user's inventory
* Users create decks and use them to battle other players
* The battle engine simulates results and returns them via API

## Core Features
* Generate cards automatically from Wikipedia articles
* Open gacha packs to receive random cards
* Manage user card inventory
* Create and manage decks
* PvP battle simulation
* Expose REST APIs for frontend interaction
* Provide Swagger API documentation

## Technical Requirements
- Programming language: TypeScript
- Backend framework: NestJS
- ORM: Prisma
- Database: implementing
- External data source: Wikipedia MediaWiki API
- Store environment variables in `.env`
- Expose REST API for frontend integration
- API documentation via Swagger

## Environment Variables (Development Environment / localhost)
```
DATABASE_URL=""
WIKIPEDIA_API_URL="https://en.wikipedia.org/w/api.php"
JWT_SECRET=""
PORT=3000
```


## Documentations & References
* https://docs.nestjs.com
* https://www.prisma.io/docs
* https://www.mediawiki.org/wiki/API:Main_page

## Instructions
* always store application data and user states in MySQL
* always create/update `PROJECT_OVERVIEW.md` after implementing a new feature
* always implement proper error handling
* always follow security best practices
* always document API routes with Swagger
* Do not use type 'any'
* always commit code after finishing a feature or fixing a bug (DO NOT commit `.env`)
* always export server logs to `./server.log` for debugging
