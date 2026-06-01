# Inventory & Order Management System

A complete FastAPI + React + PostgreSQL assessment project for managing products, customers, orders, and inventory.

## What Is Included

- Product management with unique SKU validation.
- Customer management with unique email validation.
- Order creation with multiple line items.
- Inventory validation before order creation.
- Automatic stock reduction after successful orders.
- Order cancellation with stock restoration.
- PostgreSQL persistence through SQLAlchemy.
- Responsive React dashboard.
- Dockerfiles for frontend and backend.
- Railway config for deploying the backend, frontend, and PostgreSQL on Railway.
- Docker Compose for local full-stack execution.

## Local Setup

1. Copy the environment template:

```powershell
Copy-Item .env.example .env
```

2. Open `.env` and change `POSTGRES_PASSWORD` to your own password.

3. Start the full application:

```powershell
docker compose up --build
```

4. Open the app:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

## Local Development Without Docker

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

Frontend:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

## Railway Deployment

Deploy the app as three Railway services in one project:

- PostgreSQL database
- FastAPI backend
- React/nginx frontend

Push this repository to GitHub before starting the Railway setup.

### 1. GitHub Repository Link

Create a new GitHub repository, then run:

```powershell
git init
git add .
git commit -m "Build inventory order management system"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Paste this in the form:

```text
https://github.com/AtultTomar/inventory_manager
```

### 2. Create the Railway Project

1. Open Railway and create a new project.
2. Add a PostgreSQL database service.
3. Add a backend service from your GitHub repo.
4. Add a frontend service from the same GitHub repo.

### 3. Backend Service Settings

Set the backend service root directory to:

```text
backend
```

Railway will use `backend/railway.json`, which builds `backend/Dockerfile` and starts FastAPI on Railway's `$PORT`.

Set these backend environment variables:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://YOUR_FRONTEND_DOMAIN
```

After the first backend deploy, open the backend service Networking tab and generate a public Railway domain. Your API base URL will be:

```text
https://YOUR_BACKEND_DOMAIN/api
```

### 4. Frontend Service Settings

Set the frontend service root directory to:

```text
frontend
```

Railway will use `frontend/railway.json`, which builds `frontend/Dockerfile` and serves the React build with nginx on Railway's `$PORT`.

Set this frontend environment variable:

```text
VITE_API_BASE_URL=https://YOUR_BACKEND_DOMAIN/api
```

Open the frontend service Networking tab and generate a public Railway domain.

Then go back to the backend service and update `CORS_ORIGINS` so it includes the real frontend domain:

```text
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://YOUR_FRONTEND_DOMAIN
```

Redeploy the backend after changing `CORS_ORIGINS`.

### 5. Railway Notes

- Do not add a custom start command. The Dockerfiles already define the correct commands.
- The backend exposes `/health`.
- The frontend writes `/config.js` at container startup, so changing `VITE_API_BASE_URL` in Railway does not require editing source code.
- If the backend cannot connect to Postgres, verify `DATABASE_URL` points to the Railway PostgreSQL service.

## Optional Docker Hub Image

You only need this if your assessment specifically asks for a Docker Hub image link.

Create a Docker Hub repository named `inventory-backend`, then run:

```powershell
docker login
docker build -t YOUR_DOCKERHUB_USERNAME/inventory-backend:latest ./backend
docker push YOUR_DOCKERHUB_USERNAME/inventory-backend:latest
```

Paste this in the form:

```text
https://hub.docker.com/r/YOUR_DOCKERHUB_USERNAME/inventory-backend
```

## Submission Checklist

- GitHub Repository Link: `https://github.com/AtultTomar/inventory_manager`
- Backend Docker Hub Image Link: `https://hub.docker.com/r/YOUR_DOCKERHUB_USERNAME/inventory-backend`
- Frontend Hosted URL: `https://YOUR_FRONTEND_DOMAIN`
- Backend API Hosted URL: `https://YOUR_BACKEND_DOMAIN`
