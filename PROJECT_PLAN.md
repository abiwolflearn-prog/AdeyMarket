# PROJECT_PLAN.md – EthioInfluence Master Roadmap

## 1. Product Overview

### What is EthioInfluence?
**EthioInfluence** (🇪🇹) is a unified social commerce and creator affiliate marketplace designed specifically for the Ethiopian digital economy. It brings together domestic retail brands, local artisanal producers, content creators/influencers, and everyday consumers into a single transactional ecosystem.

### Problem It Solves
1. **For Ethiopian Creators & Influencers**: Content creators on Telegram, TikTok, Instagram, and YouTube lack native monetization avenues. They previously relied on informal sponsorship deals with delayed payments or manual bank transfers. EthioInfluence gives creators instant access to physical products, trackable affiliate links, real-time commission analytics, and automated payouts to Telebirr and local bank accounts (CBE, etc.).
2. **For Ethiopian Brands & Artisans**: Local brands struggle to manage influencer relationships, track promotional ROI, or operate scalable digital storefronts. EthioInfluence provides an instant storefront builder, inventory management, automated order fulfillment queues, and campaign-boosted promotional tools without heavy upfront marketing retainers.
3. **For Ethiopian Consumers**: Consumers discover authentic local goods (Ethiopian leather, specialty coffee roasts, handwoven traditional clothing, cultural artifacts) recommended by trusted creators, with secure checkout options including Cash on Delivery (COD) and escrow-protected digital payments (Arifpay, Telebirr).

### Main Business Concept: The Unified Seller Ecosystem
EthioInfluence departs from traditional separated marketplaces by implementing a **Unified Seller Model**:
- Both **Brands** and **Creators** can operate public storefronts (`/shop/:slug`) and list products.
- Creators can both sell their own branded merchandise and promote other brands' products to earn commissions (10%–30%).
- Brands can sell directly to consumers at 0% affiliate fee or leverage creator networks with custom base and promotional commission rates.
- The platform charges a standard **5% platform processing fee** on gross order value for all transactions, aligning platform revenue with seller growth.

---

## 2. User Types & Capabilities

The platform defines three primary authenticated roles, with a planned administrative role:

| Role | Sell Products? | Create Boost Campaigns? | Generate Affiliate Links? | Buy Products? | Key Interfaces |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Brand (Seller)** | ✅ Yes | ✅ Yes | ❌ Optional | ✅ Yes | Brand Dashboard, Shop Settings, Product Management, Order Fulfillment, Boost Campaigns |
| **Creator (Influencer)** | ✅ Yes (Merch/Own) | ❌ No | ✅ Yes | ✅ Yes | Creator Dashboard, Affiliate Link Generator, Referral Analytics, Wallet & Payouts |
| **Consumer** | ❌ No | ❌ No | ❌ No | ✅ Yes | Marketplace Catalog, Cart, Checkout, Order Tracking, Public Storefronts |
| **Admin** *(Planned)* | — | — | — | — | Platform GMV monitoring, Dispute resolution, Manual escrow release, KYC verification |

---

## 3. Core Features Roadmap

### 3.1 Authentication & Profile Management
- **Role-Based Registration & Login**: Support for Brand, Creator, and Consumer registrations with JWT authentication, refresh token rotation, and HTTP-only cookies.
- **Profiles**: Creator profiles (bio, social media links, content niches, follower counts) and Brand profiles (company details, business registration, contact information).
- **Media Uploads**: Reusable `AvatarUpload` component integrating with Cloudinary/file endpoints for avatars and store logos.

### 3.2 Unified Storefronts & Product Catalog
- **Custom Merchant Shops**: Public slug-based storefronts (`/shop/:slug`) displaying merchant branding, bio, categories, and inventory.
- **Product Catalog Management**: Inventory tracking, multi-image product galleries, category filtering (Fashion, Leather, Coffee & Food, Cultural Crafts, Tech), and pricing in Ethiopian Birr (ETB).
- **Public Product View**: Detailed product pages (`/product/:id`) with stock indicators, breadcrumbs, social sharing (Telegram, TikTok, Instagram), and one-click affiliate link generation for creators.

### 3.3 Affiliate Attribution & Referral Engine
- **30-Day Cookie Attribution**: Cookied referral tracking via `ref` query parameters (`/product/:id?ref=creatorUsername`) persisting across user browsing sessions.
- **Dynamic Commission Logic**:
  - Direct orders incur 0% affiliate fee (Seller receives 95%, Platform receives 5%).
  - Referred orders deduct the seller's configured commission (e.g. 10%–15%) credited to the referring creator's wallet upon delivery.
- **Referral Analytics**: Tracking clicks, conversions, conversion rates, and gross earned commissions on Creator Dashboards.

### 3.4 Promotional Boost Campaigns
- **Sellers Launch Boosts**: Brands can launch time-delimited promotional campaigns with elevated commission rates (e.g., 20%–30%) on specific products or collections.
- **Commission Priority Engine**: Checkout calculation dynamically inspects active campaigns; active boosted campaign rates strictly override the shop's default commission rate.
- **Campaign Discovery Hub**: Dedicated discovery page (`/campaigns`) with countdown timers, eligible product previews, and instant "Promote & Earn" links.

### 3.5 Bag, Checkout & Order Lifecycle
- **Shopping Cart**: Real-time stock validation, persistent bag state, and quantity controls.
- **Multi-Method Checkout**: Support for Cash on Delivery (COD), Arifpay Card/Mobile escrow simulator, and Telebirr/CBE payment instructions.
- **Order Lifecycle Tracking**:
  - `pending` → Order placed, payment authorized/in escrow.
  - `shipped` → Merchant enters domestic courier/tracking information.
  - `delivered` → Buyer receives goods; escrow balance automatically settles to seller and creator pending balances.
  - `cancelled` → Funds returned, stock restored.

### 3.6 Wallets, Escrow & Payouts
- **Dual-Balance Wallets**: Separate tracking of `pendingBalance` (orders in transit) and `availableBalance` (cleared funds ready for withdrawal).
- **Withdrawal Requests**: Modal flow allowing creators and sellers to request payouts directly to **Telebirr**, **CBE (Commercial Bank of Ethiopia)**, **Awash Bank**, or **Bank of Abyssinia**.
- **Platform Ledger**: Immutable transaction history recording order debits, platform fee deductions, creator credits, and withdrawal events.

### 3.7 Social & Discovery (Marketplace Feed & Posts)
- **Marketplace Feed (`src/pages/Feed.tsx`)**: High-converting home discovery feed highlighting trending Ethiopian artisan products, top verified creator stores, and active holiday boost campaigns.
- **Social Posts (`src/pages/Posts.tsx`)**: Visual content showcase where creators tag shoppable products in media posts with direct "Buy Now" cards.

---

## 4. Development Phases & Current Status

| Phase | Description | Key Modules | Status |
| :--- | :--- | :--- | :---: |
| **Phase 1: Foundation & Setup** | Express server, Vite React app, MongoDB Atlas, Cloudinary, Tailwind CSS v4, Layout | `src/server.ts`, `src/config/`, `src/components/Layout.tsx` | **COMPLETED** |
| **Phase 2: Authentication & Security** | JWT tokens, Role authorization, Login/Register pages, Protected routes, Helmet, Rate limiting | `src/controllers/authController.ts`, `src/pages/Login.tsx`, `Register.tsx` | **COMPLETED** |
| **Phase 3: Profiles, Shops & Dashboards** | Brand/Creator profiles, Store settings, `AvatarUpload`, Creator & Brand Dashboards | `src/pages/ProfileEdit.tsx`, `ShopSettings.tsx`, `CreatorDashboard.tsx`, `BrandDashboard.tsx` | **COMPLETED** |
| **Phase 4: Product Catalog** | Product CRUD, image uploads, stock management, category filtering | `src/controllers/productController.ts`, `src/pages/ProductCreate.tsx`, `ProductList.tsx`, `ProductEdit.tsx` | **COMPLETED** |
| **Phase 5: Storefronts & Directory** | Public shop slug routes, product detail page, brand directory, social share links | `src/pages/PublicShop.tsx`, `PublicProduct.tsx`, `BrandDirectory.tsx` | **COMPLETED** |
| **Phase 6: Affiliate & Referral Tracking** | 30-day cookie attribution, referral clicks analytics, copy link generator | `src/controllers/referralController.ts`, `src/routes/referralRoutes.ts` | **COMPLETED** |
| **Phase 7: Bag, Checkout & Order Fulfillment** | Shopping cart, checkout calculation (5% platform fee, commission splits), order lifecycle | `src/pages/Cart.tsx`, `Checkout.tsx`, `OrderConfirmation.tsx`, `SellerOrders.tsx` | **COMPLETED** |
| **Phase 8: Payments, Escrow & Payouts** | Arifpay escrow simulation, Telebirr & CBE withdrawals, transaction ledger | `src/pages/Payouts.tsx`, `ArifpaySimulation.tsx`, `src/components/WithdrawalModal.tsx` | **COMPLETED** |
| **Phase 9: Promotional Boost Campaigns** | Campaign builder, public boost catalog, dynamic commission priority logic | `src/pages/CampaignCreate.tsx`, `CampaignList.tsx`, `src/controllers/campaignController.ts` | **COMPLETED** |
| **Phase 10: Testing & Verification** | E2E test runner (referral order, direct order, campaign boost override), production build | `src/tests/e2e.ts`, `compile_applet`, `lint_applet` | **COMPLETED** |
| **Phase 11: Marketplace Discovery & Social Feed** | Comprehensive home feed (`Feed.tsx`), creator shoppable post gallery (`Posts.tsx`) | `src/pages/Feed.tsx`, `src/pages/Posts.tsx` | **COMPLETED** |
| **Phase 12: Final QA, UI Polish & Production Readiness** | Broken route fixes, mobile navigation drawer, catch-all 404, order delivery lifecycle, live statistics, full E2E & lint audit | `src/components/Layout.tsx`, `src/App.tsx`, `src/pages/CampaignList.tsx`, `src/pages/PublicShop.tsx` | **COMPLETED** |
| **Phase 13: Creator Analytics & Insights Engine** | Aggregated performance metrics, top products breakdown, 7-day conversion trends, financial escrow sync | `src/controllers/referralController.ts`, `src/routes/referralRoutes.ts`, `src/pages/CreatorAnalytics.tsx` | **IN PROGRESS** |



---

## 5. Future Roadmap (Post-Launch)

1. **Telegram Mini App (TMA) Integration**: Allow Ethiopian consumers and creators to browse products and share referral links natively inside Telegram.
2. **Direct Telebirr SuperApp Gateway**: Direct production merchant API integration with Ethio Telecom Telebirr.
3. **Automated Courier Dispatch**: Integration with Addis Ababa courier services (e.g. Deliver Addis, Zmall, local riders) for automated dispatch and tracking webhooks.
4. **Creator Collaboration Matching**: Algorithm recommending relevant creators to brands based on product category, engagement rates, and historical conversion metrics.
