# Project Decisions – EthioInfluence (Unified Seller Ecosystem)

## 2026-09-09 – Platform Architecture (The BIG Pivot)
**Decision:** Move from "Influencer Marketing Agency" to **"Unified Commerce + Affiliate Ecosystem"**.  
**Reason:** Allows brands AND creators to sell directly, creating multiple revenue streams and reducing dependency on any single user group.  
**Impact:** Products now belong to either Brands or Creators. Orders track both seller and referrer.

---

## 2026-09-09 – Revenue Model
**Decision:** Charge **5% platform fee** on EVERY order, plus optional seller-defined affiliate commissions.  
**Reason:** Predictable, scalable, and fair. We grow with our sellers' success.  
**Alternatives:** Subscription fees (would deter small sellers), flat listing fees (reduces inventory).  
**Impact:** Our backend must always calculate 5% on every order, regardless of referral status.

---

## 2026-09-09 – Affiliate Tracking
**Decision:** Use HTTP-only cookies with 30-day attribution.  
**Reason:** Most purchases happen within 7 days, but 30 days gives creators a fair chance.  
**Impact:** Consumers can click a link, browse for days, and still credit the influencer.

---

## 2026-09-09 – Unified Seller Model
**Decision:** Brands and Creators share the same product/order models (differentiated by `sellerRole`).  
**Reason:** Code reusability. One checkout flow for all. Easier to add more seller types later.  
**Impact:** Every user with a shop is treated equally by the system.

---

## 2026-09-09 – Campaigns as "Boosted Commissions"
**Decision:** Campaigns are time-limited promotions where sellers can temporarily raise commission rates.  
**Reason:** Encourages influencers to promote products during key seasons (e.g., holidays, new product launches).  
**Impact:** When a product is in a campaign, the checkout logic uses the `boostedCommissionRate` instead of `defaultCommissionRate`.

---

## 2026-09-09 – Design Inspiration
**Decision:** Strictly follow the Cozy® layout for product pages and storefronts.  
**Reason:** Clean, trust-inspiring, and proven to convert.  
**Impact:** All shop pages, product cards, and checkout flows mirror the Cozy® screenshot.

---

## 2026-09-10 – Canonical Product URL & Backward-Compatible Routing Alias
**Decision:** Standardize all product detail URLs on canonical `/product/:id`, while maintaining `/products/:id` as a permanent backward-compatible route alias in `App.tsx`.  
**Reason:** Prevents dead links for creators who previously shared links generated with `/products/:id`, while aligning link generation across `PublicProduct.tsx`, `Feed.tsx`, and `CampaignList.tsx` to the singular canonical structure.  
**Impact:** Both `/product/:id` and `/products/:id` render the same `PublicProduct` component and seamlessly trigger referral tracking (`?ref=...`) and 30-day attribution cookies.
