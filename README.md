# Smarthub Desktop

CURRENT VERSION CAN BE FOUND AT https://github.com/smarthub-research/Smarthub-Desktop

A cross-platform desktop application for device management, analytics, and more—built with Next.js, Electron, and Python FastAPI. 
This application is built in partnership with The Ohio State University Smarthub Research Group.

## Features

- Modern React/Next.js frontend with Tailwind CSS
- Electron desktop integration for native features
- Python FastAPI backend for authentication and database APIs
- Device connectivity (Bluetooth, etc.)
- Analytics, calendar, bug reporting, and more
- Supabase authentication integration
- Modular, extensible architecture

## Prerequisites

- Node.js & npm
- Python 3.8+ & pip

## Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd smarthub-desktop
   ```
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Install Python backend dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

## Running the App

Start the frontend, Electron, and backend together:
```bash
npm start
```
This will:
- Launch the Next.js frontend (port 3000)
- Start the Electron desktop app
- Run the FastAPI backend (default port 8000)

## Project Structure

- `app/` – React/Next.js frontend pages and components
- `components/` – Shared React components (analytics, calendar, etc.)
- `electron/` – Electron main/preload scripts, handlers, and services
- `backend/` – Python FastAPI backend (APIs, routers, dependencies)
- `public/` – Static assets (images, videos, icons)

## Development

- Frontend: Edit files in `app/`
- Electron: Edit files in `electron/`
- Backend: Edit files in `backend/`
- Use `npm run dev` for frontend-only development
- Use `npm run electron:start` or `npm run fastapi:start` for individual services

## Technologies Used

- React, Next.js, Tailwind CSS
- Electron
- Python FastAPI
- Supabase
- Chart.js, Recharts
- Bluetooth (via @abandonware/noble)
