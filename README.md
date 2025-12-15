# Kemono Viewer

A modern, responsive web client for browsing Kemono content. Built with React, TypeScript, and Tailwind CSS.

![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Vite](https://img.shields.io/badge/Vite-Rolldown-purple)
![Tailwind](https://img.shields.io/badge/Tailwind-4-cyan)

## Features

- Browse recent posts from all creators
- View individual creator profiles and their posts
- Full-text search across posts
- Filter posts by service, content type, and attachments
- Grid and list view modes
- Favourite creators for quick access
- Dark/light theme support
- Image lightbox with gallery navigation
- Responsive design for mobile and desktop
- Rate limiting and retry logic for API requests

## Tech Stack

- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite (Rolldown)
- **Styling:** Tailwind CSS 4 + shadcn/ui components
- **Routing:** React Router DOM 7
- **Data Fetching:** SWR
- **Icons:** Lucide React
- **Lightbox:** yet-another-react-lightbox

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd kemono-viewer

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── components/
│   ├── kemono/          # Feature-specific components
│   │   ├── ActiveFilters.tsx
│   │   ├── FavouriteButton.tsx
│   │   ├── FilterBar.tsx
│   │   ├── PostCard.tsx
│   │   ├── PostGrid.tsx
│   │   ├── PostListItem.tsx
│   │   └── ViewToggle.tsx
│   ├── layout/          # Layout components
│   └── ui/              # shadcn/ui components
├── hooks/
│   ├── useFavourites.ts # Favourite creators management
│   └── usePostFilters.ts # Post filtering logic
├── lib/
│   ├── api.ts           # API utilities and CDN helpers
│   └── utils.ts         # General utilities
├── pages/
│   ├── Home.tsx         # Recent posts feed
│   ├── Artists.tsx      # All creators list
│   ├── Creator.tsx      # Individual creator page
│   ├── Favourites.tsx   # Favourite creators
│   └── Post.tsx         # Single post view
└── types/
    └── index.ts         # TypeScript interfaces
```

## Configuration

### API Proxy

The development server proxies `/api` requests to `kemono.cr` to avoid CORS issues. This is configured in `vite.config.ts`.

### Deployment

For GitHub Pages or static hosting, the app uses hash-based routing (`HashRouter`) and relative base paths.

To deploy:

```bash
npm run build
# Deploy the dist/ folder to your hosting provider
```

## License

MIT
