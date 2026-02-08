# Startup Instructions

Follow these steps to start the TableSync application locally.

## Prerequisite
- Docker & Docker Compose (v2 recommended)
- Node.js (v16+ recommended)

## 1. Start the Database
The database is containerized with Docker.

```bash
docker compose up -d
```
*If `docker compose` is not found, try `docker-compose up -d`.*

This starts a PostgreSQL instance on port `5433` (mapped from container port `5432`).

### Initialize Database (First Time Only)
If you are running this for the first time, you must initialize the database schema and seed data:

```bash
cd backend
npm install
node src/scripts/init-db.js
node src/scripts/seed.js
```

## 2. Start the Backend server
Open a new terminal.

```bash
cd backend
npm run dev
```
The backend will start on port `5000` (default) and connect to the database at `localhost:5433`.

**Note:** Ensure your `backend/.env` file has the correct database configuration:
```env
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=tablesync
```

## 3. Start the Frontend application
Open another new terminal.

```bash
cd frontend
npm install # requests dependencies
npm run dev
```
The frontend will start (usually on `http://localhost:5173`).

## Summary of Ports
- **Frontend**: 5173
- **Backend**: 5000
- **Database**: 5433
