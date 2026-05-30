# Exchange Project

Full-stack exchange-rate project.

```text
exchange-rate/
├─ backend/    # Spring Boot REST API
└─ frontend/   # React + TypeScript web app
```

## Features

- Stored Korea Eximbank exchange-rate list, search, detail, history chart, and calculator
- Favorite currencies
- Portfolio simulation with a user-selected investment currency and Portfolio-page-only Buy/Sell records
- Portfolio summary, currency positions, profit/loss, and transaction history in the selected investment currency
- Docker Compose deployment that pulls prebuilt frontend/backend images and runs MySQL and Redis

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

## GitHub Actions Build And EC2 Deploy

EC2 does not build the frontend or backend anymore. GitHub Actions builds Docker images with `docker build`, pushes them to Docker Hub with `docker push`, then connects to EC2 with `appleboy/ssh-action` and restarts Docker Compose when code is pushed to `main` or `master`.

Pushed images:

```text
<DOCKER_HUB_USERNAME>/exchange-rate-frontend:latest
<DOCKER_HUB_USERNAME>/exchange-rate-backend:latest
```

The workflow file is:

```text
.github/workflows/docker-publish.yml
```

The frontend image is built with:

```text
VITE_API_BASE_URL=/api
```

That means browser requests go to `http://EC2_PUBLIC_IP/api/...`, and the frontend Nginx container proxies those requests to the backend container.

### GitHub Secrets For Auto Deploy

Set these in GitHub repository settings: `Settings` -> `Secrets and variables` -> `Actions` -> `Repository secrets`.

```text
DOCKER_HUB_USERNAME      Docker Hub username
DOCKER_HUB_ACCESS_TOKEN  Docker Hub access token
EC2_HOST                 EC2 public IP or DNS name
EC2_USER                 EC2 SSH user, usually ubuntu on Ubuntu AMIs
EC2_SSH_KEY              Private key text used to SSH into EC2
EC2_PORT                 Optional. Defaults to 22
EC2_APP_DIR              EC2 directory that contains docker-compose.prod.yml and .env
```

`EC2_SSH_KEY` must match a public key in the EC2 user's `~/.ssh/authorized_keys`.

The deploy job runs this flow on EC2:

```bash
cd "$EC2_APP_DIR"
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

The EC2 deploy step pulls the latest Docker Hub images and restarts the Compose stack.

## AWS EC2 Docker Compose Deployment

This is a GitHub Actions SSH deployment to a normal EC2 Linux server. EC2 needs a one-time setup before the workflow can deploy automatically.

Do not install Java, MySQL, Redis, or Nginx directly on EC2. Install only Docker, Docker Compose, and Git. The `frontend`, `backend`, `mysql`, and `redis` services run as Docker containers.

The frontend and backend containers are pulled from Docker Hub. EC2 only runs containers; it does not run Gradle, npm, or Docker image builds.

Only port `80` should be public for the application. MySQL and Redis are reachable only inside the Docker network. Never commit `.env` to GitHub.

### Security Group

```text
22 SSH        allow only your IP if possible
80 HTTP       allow 0.0.0.0/0
8080 Backend  do not open
3306 MySQL    do not open
6379 Redis    do not open
```

For GitHub Actions auto deploy, SSH port `22` must also be reachable from the GitHub-hosted runner. The simplest setup is allowing `22` from `0.0.0.0/0` with key-only SSH, but restrict it further if you use a fixed runner or another controlled deployment path.

### Deploy

Deployment is handled by GitHub Actions only. Push to `main` or `master`, or run `Build, Push, and Deploy` manually from the GitHub Actions tab with `workflow_dispatch`.

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

Push to `main` or `master`, or rerun the `Build, Push, and Deploy` workflow from the GitHub Actions tab.

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

Frontend and backend image builds run in GitHub Actions, so EC2 memory is used only for running containers. If the backend still runs out of memory, increase the EC2 instance size or reduce container memory usage further.

### Validate Compose

```bash
docker compose -f docker-compose.prod.yml config
```
