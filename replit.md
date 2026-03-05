# Mosaic AdIntel - Competitor Ad Intelligence Dashboard

## Project Overview
A full-stack web application for competitor ad intelligence. Features a React/Vite frontend dashboard and a Node.js/Express backend API that loads and analyzes Meta (Facebook) ad data.

## Architecture

### Frontend (React + Vite + TypeScript)
- **Location**: `frontend/`
- **Port**: 5000 (bound to 0.0.0.0 for Replit proxy)
- **Key files**: `src/App.tsx` (main dashboard), `vite.config.ts`
- **Workflow**: "Start application" → `cd frontend && npm run dev`

### Backend (Node.js + Express + TypeScript)
- **Location**: `backend/`
- **Port**: 3001 (localhost)
- **Key files**: `src/index.ts` (entry point), `src/routes/`, `src/services/`
- **Workflow**: "Backend API" → `cd backend && npm run dev`
- **Runtime**: tsx (TypeScript runner)

## API Endpoints
- `GET /api/meta-ads` - Load ad data (from sample JSON or in-memory store)
- `POST /api/upload` - Upload CSV file
- `GET /api/ads` - Get stored ads
- `POST /api/insights` - Generate AI insights (requires OPENAI_API_KEY)
- `GET /api/health` - Health check

## Configuration
- Frontend proxies `/api/*` to `http://localhost:3001` via Vite proxy config
- CORS configured to allow localhost, Replit domains, Render, and Vercel
- `OPENAI_API_KEY` optional — mock insights returned without it

## Environment Variables
- `OPENAI_API_KEY` (optional) - For live AI insights in backend
- `PORT` (optional) - Backend port, defaults to 3001

## Data
- `backend/data/sample_ads.json` - Sample Meta ads data loaded on startup
- In-memory store updated when CSV is uploaded
