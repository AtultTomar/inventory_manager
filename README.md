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

## Manual Deployment Steps

Use these values when your assessment form asks for links.

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

### 2. Backend Docker Hub Image Link

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

### 3. Hosted PostgreSQL

Create a free PostgreSQL database on a provider such as Neon, Supabase, Render, or Railway.

Copy the database connection string and use it as:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
```

If your provider gives separate fields, paste them into the same format above. If the URL starts with `postgres://`, change it to `postgresql://`.

### 4. Backend API Hosted URL

Deploy the backend on a service that supports Docker or Python web services.

For Railway, deploy the repository root normally. The included `railway.json` tells Railway to build `Dockerfile.railway`, which deploys the FastAPI backend from the `backend` folder.

The Railway deploy healthcheck is disabled in `railway.json` because Railway can mark a deployment failed while the service is still being connected to a database or public domain. The app still exposes `/health` after deployment.

Set these environment variables in the backend hosting dashboard:

```text
DATABASE_URL=your hosted postgres connection string
CORS_ORIGINS=http://localhost:3000,https://YOUR_FRONTEND_DOMAIN
```

Do not use `start.sh` on Railway. If another host asks for a start command, use:

```text
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

After deployment, paste your backend URL:

```text
https://YOUR_BACKEND_DOMAIN
```

The API endpoints are under:

```text
https://YOUR_BACKEND_DOMAIN/api
```

If Railway shows `Unexposed service`, open the backend service, go to Settings or Networking, and generate a public Railway domain.

### 5. Frontend Hosted URL

Deploy the `frontend` folder on Vercel, Netlify, or Render Static Site.

Set this environment variable in the frontend hosting dashboard:

```text
VITE_API_BASE_URL=https://YOUR_BACKEND_DOMAIN/api
```

Use these build settings:

```text
Root directory: frontend
Build command: npm run build
Publish directory: dist
```

After deployment, copy the frontend domain and update the backend `CORS_ORIGINS` variable to include it.

Paste this in the form:

```text
https://YOUR_FRONTEND_DOMAIN
```

## Submission Checklist

- GitHub Repository Link: `https://github.com/AtultTomar/inventory_manager`
- Backend Docker Hub Image Link: `https://hub.docker.com/r/YOUR_DOCKERHUB_USERNAME/inventory-backend`
- Frontend Hosted URL: `https://YOUR_FRONTEND_DOMAIN`
- Backend API Hosted URL: `https://YOUR_BACKEND_DOMAIN`
