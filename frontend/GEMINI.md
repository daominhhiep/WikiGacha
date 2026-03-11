## Overview

This project is the frontend application for the Wikigacha game.  
It provides a modern web interface for players to open gacha packs, manage cards, build decks, and participate in battles.

The frontend communicates with the backend API to retrieve game data and perform gameplay actions.

## Concept

- Players interact with the game through a web interface
- Users can open gacha packs to receive random cards
- Cards are stored in a user inventory
- Players can build decks from owned cards
- Decks can be used in battles against other players

## How it works

- The frontend sends API requests to the backend server
- Game data (cards, packs, decks, battles) is fetched and rendered in the UI
- Users perform actions such as opening packs or creating decks
- The UI updates in real time based on API responses

## Core Features

- User authentication interface
- Open gacha pack UI
- Card inventory management
- Deck builder interface
- Battle interface and result display
- Responsive and modern UI components
- API integration with backend services

## Technical Requirements

- Programming language: TypeScript (Node.js 20+)
- Framework: React
- Build tool: Vite
- UI components: Shadcn UI
- Styling: Tailwind CSS
- State server: TanStack Query
- State client: Zustand
- State form: React Hook Form
- API communication: REST API

## Environment Variables (Development Environment / localhost)

```
VITE_API_BASE_URL="http://localhost:3000
```

## Documentations & References

- https://react.dev
- https://vitejs.dev
- https://ui.shadcn.com
- https://tailwindcss.com

## Instructions

- always separate UI components and business logic
- always implement proper error handling for API requests
- always create reusable components
- always keep UI responsive and user-friendly
- always store environment variables in `.env`
- always document important components and pages
- always commit code after finishing a feature or fixing a bug
