# Exchange Rate Backend

Spring Boot REST API for stored Korea Eximbank exchange-rate data, calculations, favorites, portfolio simulation, Redis caching, and JWT login.

## Local Infrastructure

Start local MySQL and Redis:

```bash
docker compose -f docker-compose.local.yml up -d
```

Check MySQL:

```bash
docker exec -it exchange-mysql mysql -u root -p
```

Check Redis:

```bash
docker exec -it exchange-redis redis-cli
```

## Environment Variables

Keep real secrets in `.env` or deployment environment variables. Do not commit them.

```bash
EXCHANGE_API_KEY=your_exchange_api_key_here
AUTH_JWT_SECRET=replace_with_a_long_random_secret
```

Production also uses `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, and `FRONTEND_URL`.

## Run

```bash
./gradlew bootRun --args='--spring.profiles.active=local'
```

Windows PowerShell:

```powershell
$env:EXCHANGE_API_KEY="your_exchange_api_key_here"
$env:AUTH_JWT_SECRET="replace_with_a_long_random_secret"
.\gradlew.bat bootRun --args='--spring.profiles.active=local'
```

## Auth Flow

Register:

```http
POST http://localhost:8080/api/auth/register
```

Login:

```http
POST http://localhost:8080/api/auth/login
```

Use the returned token for protected APIs:

```http
Authorization: Bearer <accessToken>
```

Favorites require login. Portfolio APIs use `X-USER-KEY` and default to `demo-user` when the header is missing. Public exchange-rate list, search, detail, history, and calculation APIs can be used without login.

Portfolio Buy/Sell is available only through portfolio APIs. Users deposit KRW investment cash first. BUY uses the selected date's stored DB exchange rate, and SELL uses the latest stored business-day DB exchange rate. Clients cannot provide or edit exchange rates.

## Main API Flow

Manual sync:

```http
POST http://localhost:8080/api/admin/exchange-rates/sync
```

Sync a specific date:

```http
POST http://localhost:8080/api/admin/exchange-rates/sync?date=2026-05-24&force=false
```

Today exchange-rate list:

```http
GET http://localhost:8080/api/exchange-rates/today
```

Latest 7 stored records:

```http
GET http://localhost:8080/api/exchange-rates/USD/history
```

Portfolio dashboard:

```http
GET http://localhost:8080/api/portfolio
```

Deposit investment cash:

```http
POST http://localhost:8080/api/portfolio/deposits
```

Create simulated Buy/Sell transactions:

```http
POST http://localhost:8080/api/portfolio/buy
POST http://localhost:8080/api/portfolio/sell
```

Portfolio transactions are records for simulation and do not execute real trades.

Swagger UI:

```http
http://localhost:8080/swagger-ui/index.html
```

OpenAPI YAML:

```http
http://localhost:8080/swagger.yml
```

## External API Usage Policy

General user 조회 APIs do not directly call the external Korea Eximbank API. External calls happen only through the scheduler or the admin sync API. Avoid repeatedly calling manual sync because the Korea Eximbank API has a daily request limit.

`force=false` skips the external API call when data for the same date already exists. Use `force=true` only when the stored date must be refreshed.

## Test

```bash
./gradlew test
```

Integration tests use Testcontainers for MySQL and Redis when Docker is available.
