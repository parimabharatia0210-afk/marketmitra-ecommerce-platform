# LocalOps Backend

API server for seller registration and logo uploads.

## Setup

```bash
cd localops-backend
npm install
npm start
```

Server runs at `http://localhost:3000`.

## Data Storage

| File/Folder        | Purpose                          |
|--------------------|----------------------------------|
| `sellers.json`     | All registered seller data       |
| `uploads/shop-logos/` | Uploaded shop logo images     |

## API Endpoints

| Method | Endpoint             | Description                    |
|--------|----------------------|--------------------------------|
| GET    | `/api/health`        | Health check                   |
| GET    | `/api/sellers`       | List sellers (no passwords)    |
| GET    | `/api/sellers/check-email` | Check duplicate email     |
| POST   | `/api/sellers`       | Register a new seller          |
| POST   | `/api/seller/login`  | Seller login, returns token    |
| POST   | `/api/upload/logo`   | Upload shop logo (multipart, field: `logo`) |

### Migrating previous JSON records

If you have historical data inside `sellers.json`, move it into MongoDB via:

```bash
cd localops-backend
npm run migrate:sellers
```

This script lowercases the email field and upserts each entry into the `sellers` collection inside `marketmitra_db`.

## Seller Collection Schema (sellers.json)

Each seller document stores:
| Field | Type | Description |
|-------|------|-------------|
| id | string | Auto-generated ID |
| name | string | Seller name |
| email | string | Unique email |
| contact | string | Phone number |
| shopName | string | Shop name |
| address | string | Full address |
| city | string | City |
| state | string | State |
| pincode | string | 6-digit pincode |
| password | string | Password (plain - add hashing for production) |
| shopDescription | string | Shop description (optional) |
| logo | string | Path: `assets/shop-logos/name.svg` or `/uploads/shop-logos/filename.png` |
| createdAt | string | ISO timestamp (auto-managed by MongoDB) |
