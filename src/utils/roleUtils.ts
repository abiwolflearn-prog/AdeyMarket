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
  icon?: string;
  description: string;
}

export const USER_ROLE_OPTIONS: RoleOption[] = [
  {
    id: "creator",
    label: "Creator",
    icon: "👤",
    description: "Promote products, collaborate with brands, and earn commissions.",
  },
  {
    id: "brand",
    label: "Company / Brand",
    icon: "🏢",
    description: "Sell products, create campaigns, and work with creators.",
  },
  {
    id: "consumer",
    label: "Customer",
    icon: "🛍️",
    description: "Discover products, shop, and receive creator discounts.",
  },
];

/**
 * Returns the designated portal landing route for each role:
 * - creator -> /creator/dashboard
 * - brand / company -> /company/dashboard
 * - consumer / buyer / customer -> /customer
 * - admin -> /admin/dashboard
 */
export function getRoleHomeRoute(role?: string | null): string {
  if (!role) return "/customer";
  switch (role.toLowerCase()) {
    case "creator":
      return "/creator/dashboard";
    case "brand":
    case "company":
      return "/company/dashboard";
    case "admin":
      return "/admin/dashboard";
    case "consumer":
    case "buyer":
    case "customer":
    default:
      return "/customer";
  }
}

