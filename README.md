# EthioInfluence 🇪🇹
> **Ethiopia's Premier Social Commerce & Creator Affiliate Marketplace**

EthioInfluence bridges the gap between Ethiopian retail brands and content creators. It empowers creators to earn transparent commissions through tracked affiliate links and enables local brands to scale their digital sales with automated order fulfillment and domestic payment processing (Telebirr, Arifpay, CBE Birr).

---

## 🌟 Key Features

### 1. 🛍️ Brand & Merchant Storefronts
- **Custom Shop Builder:** Sellers can configure branded store names, bios, logos, and custom base commission rates (0%–30%).
- **Product Catalog Management:** Multi-image uploads (Cloudinary-ready), stock level tracking, category tagging, and pricing in Ethiopian Birr (ETB).
- **Brand Analytics Dashboard:** Track gross merchandise value (GMV), net earnings after fees and creator commissions, active referral counts, and fulfillment status.

### 2. 🔗 Creator Affiliate Engine
- **One-Click Referral Generation:** Creators generate unique product referral links (`/product/:id?ref=creatorId`) and shop links with automatic clipboard copy.
- **30-Day Attribution Window:** Cookied referral tracking persists attribution across customer sessions.
- **Transparent Creator Wallet:** Real-time visibility into pending balance (in escrow until order delivery) and available balance ready for withdrawal.
- **Telebirr & Arifpay Payouts:** Automated payout requests with bank account / mobile wallet verification.

### 3. 🚀 Promotional Boost Campaigns
- **Time-Limited Commission Multipliers:** Brands launch targeted promotional campaigns (e.g. 25% boosted commission) on specific products or storewide.
- **Dynamic Commission Priority:** The checkout engine automatically detects active campaigns and awards the higher promotional rate over the shop's default rate.
- **Creator Discovery Marketplace:** Browse active boosted campaigns with countdown timers and instant promote buttons.

### 4. 💳 Ethiopian Payment Gateways & Escrow
- **Supported Payment Gateways:** Telebirr, Arifpay (card & mobile money), CBE Birr, and Cash on Delivery (COD).
- **Escrow Protection:** Buyer funds remain in escrow during transit. Payout balances are released to sellers and creators upon delivery confirmation.
- **Transparent 5% Platform Fee:** Standard marketplace fee with automated splits between merchant, influencer, and platform.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Motion, Lucide Icons, React Router v7
- **Backend:** Node.js, Express, TypeScript, Mongoose
- **Database:** MongoDB Atlas (with in-memory fallbacks for resilient local preview)
- **Security:** Helmet, Express Rate Limiting, NoSQL injection prevention, XSS cleaning
- **Monitoring:** Sentry-ready structured logging, React Error Boundary

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd ethioinfluence
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

| Variable | Description |
| :--- | :--- |
| `PORT` | Server port (default: 3000) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT authentication |
| `ARIFPAY_API_KEY` | Arifpay merchant API key |
| `CLOUDINARY_*` | Cloudinary credentials for image storage |
| `SENTRY_DSN` | Sentry error tracking DSN (optional) |

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Automated End-to-End (E2E) Tests
EthioInfluence includes a dedicated test runner verifying complete transactional flows:
```bash
npm run test:e2e
```
**Tests Covered:**
- `Test 10.1`: Seller creates product → Creator promotes → Consumer purchases with referral tracking
- `Test 10.2`: Direct purchase without referral (0% affiliate deduction)
- `Test 10.3`: Campaign boosted commission overriding default shop rate

---

## 📡 API Overview

### Authentication & Profiles
- `POST /api/auth/register` — Register as Brand, Creator, or Consumer
- `POST /api/auth/login` — Authenticate and receive JWT cookie & token
- `GET /api/profile/me` — Current authenticated user profile and balances
- `PATCH /api/profile` — Update contact details and payment preferences

### Shops & Catalog
- `POST /api/shop` — Create or update seller shop
- `GET /api/shop/:slug` — Public view of merchant store
- `GET /api/products` — Marketplace catalog with category and search filters
- `POST /api/products` — Create new inventory item (Seller only)
- `GET /api/products/:id` — Product detail with active campaign detection

### Campaigns (Boosts)
- `GET /api/campaigns` — Discover active promotional boost campaigns
- `POST /api/campaigns` — Launch a boosted commission campaign (Seller only)
- `GET /api/campaigns/:id` — Detailed campaign parameters & eligible products

### Orders & Financials
- `POST /api/orders` — Checkout order with referral attribution & escrow setup
- `GET /api/orders/my-orders` — Buyer purchase history
- `GET /api/orders/seller` — Merchant incoming order management
- `PATCH /api/orders/:id/status` — Advance order status (pending → shipped → delivered)
- `POST /api/payments/withdraw` — Request withdrawal to Telebirr or bank account

---

## 🔒 Security Hardening

- **Rate Limiting:** `apiLimiter` (300 req/15 min) for public routes; `authLimiter` (30 req/15 min) for login/registration to prevent brute-force attacks.
- **NoSQL Injection Sanitization:** Deep-strips MongoDB reserved `$` operators and dots from input bodies, params, and queries.
- **XSS Protection:** Neutralizes malicious `<script>` tags and inline JavaScript handlers.
- **HTTP Security Headers:** Powered by `helmet` with custom CSP rules.

---

## 📄 License
MIT License © 2026 EthioInfluence
