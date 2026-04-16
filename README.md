# 🎮 GameShelf

A premium personal game library web application to track your collection, write reviews, and stay updated with your friends' gaming activity.

## 🚀 Overview

GameShelf is a full-stack monorepo project built with modern web technologies, focusing on high-performance vanilla JavaScript and a sophisticated custom design system.

### Key Features
- **Modern UI/UX**: Dark-themed, glassmorphic design system with fluid animations and surface-level depth.
- **Activity Feed**: Dynamic layouts for game reviews and shelf updates.
- **Personal Library**: Track your "Owned" and "In Progress" games with detailed stats.
- **Design Integrated**: Directly connected to Google Stitch via MCP for design-to-code accuracy.

## 🛠️ Technology Stack

- **Frontend**: [Vite](https://vitejs.dev/) + Vanilla JavaScript (ES Modules)
- **Styling**: Vanilla CSS with a token-based design system
- **Backend**: [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Design Tooling**: [Google Stitch](https://stitch.withgoogle.com/) via Model Context Protocol (MCP)

## 📁 Project Structure

```text
gameshelf/
├── frontend/             # Vite-powered SPA
│   ├── src/
│   │   ├── components/   # Reusable UI components (Navbar, GameCard, etc.)
│   │   ├── pages/        # Page-level view logic (Home, Shelf, etc.)
│   │   ├── styles/       # Design tokens and global CSS
│   │   └── lib/          # API clients and utilities
│   └── index.html
├── backend/              # Node.js API
│   ├── routes/           # Auth, Shelf, and Profile endpoints
│   ├── middleware/       # Authentication and logging
│   └── server.js
└── .gitignore            # Monorepo git configuration
```

## 🎨 Design System

The project uses a custom-built CSS design system defined in `frontend/src/styles/tokens.css`.
- **Primary Color**: `#cf96ff` (Lavender/Purple)
- **Surface Strategy**: No 1px borders; depth is created using background color shifts between surface levels.
- **Typography**: Inter (Weights 400/500/700/800).
- **Effects**: Backdrop blur (20px) on floating elements with 60% opacity.

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation

1. Clone the repository.
2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

### Running the App

To start the frontend development server:
```bash
cd frontend
npm run dev
```
The application will be available at `http://localhost:3000`.

## 📄 License
MIT
