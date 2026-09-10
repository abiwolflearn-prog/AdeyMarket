# Design System – Strict Cozy® Clone for EthioInfluence

## 1. Header Structure
```jsx
<Header>
  <Logo>EthioInfluence</Logo>
  <SearchBar placeholder="Search for creators, products..." />
  <NavLinks>Feed | Campaigns | Brands | Deals</NavLinks>
  <UserActions>Account | Wishlist | Bag</UserActions>
</Header>
```

## Spacing & Typography
- **Font:** Inter (sans-serif) - clean and readable.
- **Border Radius:** `rounded-lg` (8px) for cards, `rounded-full` for avatars.
- **Shadows:** `shadow-md` for cards to give the Cozy® "elevated" feel.

## Key Component Styling Rules
1. **Buttons:** 
   - Primary: `bg-[#2E7D32] text-white hover:bg-green-800 px-6 py-2 rounded-lg`
   - Secondary (Outline): `border border-[#F9A825] text-[#F9A825] hover:bg-yellow-50`
2. **Cards:** `bg-[#FAFAFA] p-4 rounded-lg shadow-md border border-gray-100`
3. **Product Links:** Displayed as a pill/tag inside the post: `bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-2`
4. **Status Badges:** 
   - Open: `bg-green-100 text-[#2E7D32]`
   - Pending: `bg-yellow-100 text-[#F9A825]`
   - Completed: `bg-blue-100 text-[#1A237E]`
