# Exchange Rate Frontend

React + TypeScript exchange-rate web app. The frontend calls only the Spring Boot backend API and never calls the external Korea Eximbank API directly.

## Tech Stack

- React
- TypeScript
- Vite
- React Router
- Axios
- Recharts
- Tailwind CSS
- ESLint
- Prettier
- Vitest
- React Testing Library

## Environment Variables

Create `.env.local` from `.env.example`.

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_USE_MOCK=false
VITE_SYNC_ON_HOME_LOAD=true
VITE_HOME_SYNC_FORCE=true
VITE_HOME_SYNC_LOOKBACK_DAYS=7
```

Mock mode:

```env
VITE_USE_MOCK=true
```

If `VITE_SYNC_ON_HOME_LOAD=true`, the home page first calls:

```text
POST /api/admin/exchange-rates/sync?date=YYYY-MM-DD&force=true
```

It starts from today and looks back up to `VITE_HOME_SYNC_LOOKBACK_DAYS` days until the backend stores data. This helps on weekends and holidays when today's Korea Eximbank data may be empty. Then it loads:

```text
GET /api/exchange-rates/today
```

Set `VITE_HOME_SYNC_FORCE=false` to let the backend skip the external API call when the same date already exists.

Production example:

```env
VITE_API_BASE_URL=https://your-backend-api.example.com
VITE_USE_MOCK=false
```

## Run

```bash
npm install
npm run dev
```

The default Vite URL is:

```text
http://localhost:5173
```

## Scripts

```bash
npm run dev
npm run build
npm run test
npm run lint
npm run format
```

## Main Screens

- `/`: today exchange-rate list, search/filter, favorite toggle, calculator access
- `/login`: login
- `/register`: register with a short feature message for favorites
- `/currencies/:curUnit`: currency detail, fixed latest 7 stored-rate chart, date selector
- `/favorites`: favorite currencies
- `/portfolio`: create one portfolio account, choose an investment currency, deposit cash, search currencies, Buy/Sell, positions, and transactions
- `*`: not found

## Login

The frontend stores the backend JWT access token in localStorage and sends it as:

```text
Authorization: Bearer <accessToken>
```

Favorites are available only after login. Portfolio transactions use the `X-USER-KEY` header and default to `demo-user` when no user key is provided. Public exchange-rate views and the calculator remain available without login.

Buy/Sell is only available on the Portfolio page. Users must create a portfolio account and select an investment currency before buying. Cash, total asset value, current value, and profit/loss are displayed in that investment currency. BUY uses the selected historical date and the backend may sync that missing date once. SELL uses only the latest stored business-day backend rate. The frontend displays rates for preview, but users cannot type or edit exchange rates.

## API Policy

The frontend calls only backend endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/exchange-rates/today`
- `GET /api/exchange-rates/search?keyword=usd`
- `GET /api/exchange-rates/{curUnit}`
- `GET /api/exchange-rates/{curUnit}/history`
- `GET /api/exchange-rates/{curUnit}/rate?date=YYYY-MM-DD`
- `GET /api/exchange-rates/{curUnit}/latest-rate`
- `POST /api/exchange-rates/calculate`
- `GET /api/favorites`
- `POST /api/favorites/{curUnit}`
- `DELETE /api/favorites/{curUnit}`
- `GET /api/portfolio`
- `GET /api/portfolio/summary`
- `GET /api/portfolio/positions`
- `GET /api/portfolio/transactions`
- `POST /api/portfolio/account`
- `POST /api/portfolio/deposits`
- `POST /api/portfolio/buy`
- `POST /api/portfolio/sell`
- `DELETE /api/portfolio/transactions/{transactionId}`
- `POST /api/admin/exchange-rates/sync`

The history API is fixed to the latest 7 stored records. The frontend never sends a `days` query parameter and never builds URLs such as:

```text
/api/exchange-rates/USD/history?days=7
```

## Backend CORS

The backend must allow the frontend origin. For local development, allow:

```text
http://localhost:5173
```

For Vercel deployment, add the deployed Vercel URL to the backend CORS allow list through the backend `FRONTEND_URL` environment variable.

## Vercel Deployment

Set Vercel environment variables:

```env
VITE_API_BASE_URL=https://exchange-api.example.com
VITE_USE_MOCK=false
```

Then deploy the `frontend` directory as the Vercel project root.
