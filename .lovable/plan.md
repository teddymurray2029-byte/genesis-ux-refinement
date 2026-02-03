

# Genesis Data Console — React Rebuild Plan

## Overview
Rebuild the Genesis Multi-Octave Hierarchical Memory System UI in React, connecting to your existing Python/GenesisDB backend. The new UI will use modern shadcn components with a clean, professional design while addressing the UX issues you mentioned.

---

## Core Features

### 1. **Dashboard Layout with Sidebar Navigation**
A responsive layout with collapsible sidebar for navigating between views:
- **Data Console** — Main table viewer and CRUD operations
- **Brain Visualization** — 3D WebGL memory space visualization
- **Logs** — System log monitoring and management
- **Settings** — API connection configuration

### 2. **Database CRUD Interface** (Fixing data table UX)
A polished table experience with:
- **Responsive data table** — Using shadcn Table with proper column resizing
- **Smart filtering** — Real-time search with debouncing to prevent lag
- **Row selection** — Clear visual feedback when selecting/editing
- **Inline editing panel** — Slide-out drawer for editing records
- **SQL query editor** — Syntax-highlighted query input with execution stats
- **Empty states** — Clear messaging when no data or no matches
- **Pagination** — For large datasets (the original loaded everything)
- **Export to CSV** — Download filtered data

### 3. **Real-Time Data Sync via WebSocket**
Connect to your existing WebSocket server (`ws://localhost:8000/ws`):
- **Connection status indicator** — Shows live/disconnected/reconnecting state
- **Auto-reconnection** — Graceful handling of dropped connections
- **Live data updates** — Tables refresh when data changes on the server
- **Last sync timestamp** — Visual indicator of data freshness

### 4. **3D Brain Visualization** (Fixing 3D issues)
Using React Three Fiber (@react-three/fiber v8.18 + three.js):
- **WaveCube 128³ visualization** — Render memory clusters as particles
- **Orbit controls** — Pan, zoom, rotate the 3D space
- **Performance optimizations** — Instanced meshes for handling many particles
- **Interactive clusters** — Click to inspect memory nodes
- **Smooth animations** — Transitions when data updates

### 5. **Logs & Monitoring View**
- **Log table** — Filterable by level (info, warn, error)
- **Time-based filtering** — View logs from specific time ranges
- **Auto-refresh** — Live updates via WebSocket
- **Log details drawer** — Expand to see full log content

### 6. **Settings & Configuration**
- **API endpoint configuration** — Set your backend URL
- **Theme toggle** — Light/dark mode support
- **Connection testing** — Verify backend connectivity

---

## Design Approach (Modern shadcn)
- **Clean, minimal aesthetic** with proper spacing and typography
- **Card-based layouts** for distinct content sections
- **Consistent color palette** using shadcn/Tailwind design tokens
- **Dark mode support** built-in from the start
- **Responsive design** — Works on desktop and tablet
- **Loading skeletons** — Visual feedback during data fetches
- **Toast notifications** — For save confirmations, errors, etc.

---

## Technical Approach

### Frontend Architecture
- **React + TypeScript** with Vite
- **React Router** for page navigation
- **TanStack Query** for API data fetching with caching
- **Zustand or React Context** for global state (connection status, config)
- **React Hook Form + Zod** for form validation

### 3D Rendering
- **@react-three/fiber@^8.18** for React integration with Three.js
- **@react-three/drei@^9.122** for helper components (OrbitControls, etc.)
- **Instanced rendering** for performance with many particles

### Backend Connection
- **Fetch API** for REST endpoints (`/schema`, `/query`, `/health`)
- **Native WebSocket** with reconnection logic
- **Configurable base URL** — Defaults to `http://localhost:8000`

---

## UX Improvements from Original

| Original Issue | Fix |
|----------------|-----|
| All rows loaded at once | Pagination + virtual scrolling for large tables |
| Filter input had no debounce | Debounced filtering to prevent lag |
| Row selection unclear | Clear highlight + sticky detail panel |
| 3D visualization performance | Instanced meshes + proper canvas sizing |
| Disabled "Coming soon" buttons | Implement or remove disabled features |
| Navigation hard to understand | Clear sidebar with icons + labels |
| No loading states | Skeleton loaders during data fetches |

---

## Deliverables

1. **Dashboard layout** with sidebar navigation
2. **Data Console page** — Full CRUD with table, filters, editing drawer
3. **Brain Visualization page** — Interactive 3D view with React Three Fiber
4. **Logs page** — Filterable log viewer
5. **Settings page** — Backend URL config + theme toggle
6. **WebSocket integration** — Real-time updates with status indicator
7. **Responsive design** — Works on 1024px+ screens

This gives you a feature-complete React rebuild of the Genesis UI with modern UX patterns, ready to connect to your existing backend.

