import { Role } from "../context/AuthContext";

/**
 * Maps system/database roles to user-facing product terminology.
 * Database / Backend API values: "brand", "creator", "consumer" (plus upcoming "admin")
 * Product-facing display values: "Company", "Creator", "Buyer", "Admin"
 */

export type ProductRoleTerminology = "Company" | "Creator" | "Buyer" | "Admin";

/**
 * Returns the human-readable product display name for a given role.
 * - brand -> Company
 * - consumer -> Buyer
 * - creator -> Creator
 * - admin -> Admin
 */
export function getRoleDisplayName(role?: string | null): string {
  if (!role) return "Buyer";
  switch (role.toLowerCase()) {
    case "brand":
      return "Company";
    case "creator":
      return "Creator";
    case "consumer":
      return "Buyer";
    case "admin":
      return "Admin";
    default:
      return role.charAt(0).toUpperCase() + role.slice(1);
  }
}

/**
 * Returns a short portal title for navigation and headers.
 * e.g., "Company Portal", "Creator Portal", "Buyer Portal"
 */
export function getPortalTitle(role?: string | null): string {
  const name = getRoleDisplayName(role);
  return `${name} Portal`;
}

/**
 * Role selection configuration options for registration and UI selectors,
 * preserving underlying backend enum values while presenting modern product terms.
 */
export interface RoleOption {
  id: Role;
  label: string;
  description: string;
}

export const USER_ROLE_OPTIONS: RoleOption[] = [
  {
    id: "consumer",
    label: "Buyer",
    description: "Shop authentic local Ethiopian products and discover creator recommendations.",
  },
  {
    id: "creator",
    label: "Creator",
    description: "Promote company campaigns, share shoppable links, and earn commissions.",
  },
  {
    id: "brand",
    label: "Company",
    description: "Launch campaigns, manage your storefront catalog, and fulfill customer orders.",
  },
];
