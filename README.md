# Exchange Project

Full-stack exchange-rate project.

```text
exchange-rate/
├─ backend/    # Spring Boot REST API
└─ frontend/   # React + TypeScript web app
```

## Local Development

Backend details are in [backend/README.md](backend/README.md), and frontend details are in [frontend/README.md](frontend/README.md).

Run local MySQL and Redis:

```powershell
cd backend
docker compose -f docker-compose.local.yml up -d
```

Run the backend:

```powershell
cd backend
$env:EXCHANGE_API_KEY="your_exchange_api_key_here"
$env:AUTH_JWT_SECRET="replace_with_a_long_random_secret"
.\gradlew.bat bootRun --args='--spring.profiles.active=local'
```

Run the frontend:

```powershell
cd frontend
npm install
npm run dev
```

## Features

- Stored Korea Eximbank exchange-rate list, search, detail, history chart, and calculator
- Favorite currencies
- Portfolio simulation with a user-selected investment currency and Portfolio-page-only Buy/Sell records
- Portfolio summary, currency positions, profit/loss, and transaction history in the selected investment currency
- Docker Compose deployment for frontend, backend, MySQL, and Redis

Portfolio transactions are record/simulation data only. They do not execute real trades.
Buy/Sell is available only on the Portfolio page. Create one portfolio account first, choose its investment currency from the dropdown, and deposit cash in that currency. BUY uses the selected historical date; if that date is missing in DB, the backend attempts one Korea Eximbank sync for that date. SELL uses only the latest stored business-day rate and never accepts a user-entered rate.

## Main APIs

```text
GET    /api/exchange-rates/today
GET    /api/exchange-rates/search?keyword=usd
GET    /api/exchange-rates/{curUnit}
GET    /api/exchange-rates/{curUnit}/history
GET    /api/exchange-rates/{curUnit}/rate?date=2026-05-22
GET    /api/exchange-rates/{curUnit}/latest-rate
POST   /api/exchange-rates/calculate

GET    /api/favorites
POST   /api/favorites/{curUnit}
DELETE /api/favorites/{curUnit}

GET    /api/portfolio
GET    /api/portfolio/summary
GET    /api/portfolio/positions
GET    /api/portfolio/positions/{curUnit}
GET    /api/portfolio/transactions
POST   /api/portfolio/account
POST   /api/portfolio/deposits
POST   /api/portfolio/buy
POST   /api/portfolio/sell
DELETE /api/portfolio/transactions/{transactionId}
```

The history API always uses the latest 7 stored records. It does not use a `days` query parameter.

## AWS EC2 Docker Compose Deployment

This is not an AWS-managed automatic deployment. EC2 is a virtual Linux server, and you manually run Docker Compose after connecting to the server.

Do not install Java, MySQL, Redis, or Nginx directly on EC2. Install only Docker, Docker Compose, and Git. The `frontend`, `backend`, `mysql`, and `redis` services run as Docker containers.

Only port `80` should be public for the application. MySQL and Redis are reachable only inside the Docker network. Never commit `.env` to GitHub.

### Prepare EC2

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git
sudo usermod -aG docker ubuntu
```

Log out and SSH back in, then verify:

```bash
docker --version
docker compose version
```

### Security Group

```text
22 SSH        allow only your IP if possible
80 HTTP       allow 0.0.0.0/0
8080 Backend  do not open
3306 MySQL    do not open
6379 Redis    do not open
```

### Clone And Configure

```bash
git clone <YOUR_REPOSITORY_URL>
cd exchange-rate
nano .env
```

Example `.env`:

```env
EXCHANGE_API_KEY=your_real_api_key
DB_PASSWORD=your_db_password
AUTH_JWT_SECRET=replace_with_a_long_random_jwt_secret
```

Use a long random value for `AUTH_JWT_SECRET` in production.

### Deploy

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Browser:

```text
http://EC2_PUBLIC_IP
```

API:

```text
http://EC2_PUBLIC_IP/api/exchange-rates/today
```

Swagger:

```text
http://EC2_PUBLIC_IP/swagger-ui/index.html
```

### Operations

```bash
docker ps
docker logs -f exchange-backend
docker compose -f docker-compose.prod.yml logs -f
```

Update deployment:

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Stop:

```bash
docker compose -f docker-compose.prod.yml stop
```

Start:

```bash
docker compose -f docker-compose.prod.yml start
```

Shut down containers:

```bash
docker compose -f docker-compose.prod.yml down
```

Do not run `docker compose down -v` unless you intentionally want to delete the MySQL volume. It removes persisted database data.

### Memory Note

On `t2.micro` or `t3.micro`, running Spring Boot, MySQL, Redis, and Nginx on one server can be tight. The backend container uses:

```env
JAVA_TOOL_OPTIONS=-Xms128m -Xmx384m
```

If builds fail because of memory pressure, build images with GitHub Actions or locally, push them to a registry, and pull them from EC2.

### Validate Compose

```bash
docker compose -f docker-compose.prod.yml config
```
