/**
 * Client role definitions and role-specific functions (TypeScript version)
 */

export const CLIENT_ROLES = {
  STANDARD: "standard",
  PREMIUM: "premium",
  ENTERPRISE: "enterprise",
} as const;

export type ClientRole = typeof CLIENT_ROLES[keyof typeof CLIENT_ROLES];

// Define the shape of a client user
export interface ClientUser {
  id?: string;
  full_name?: string;
  email?: string;
  role?: string;
}

// ========================
// Get client role from user
// ========================
export const getClientRole = (user?: ClientUser): ClientRole => {
  if (!user) return CLIENT_ROLES.STANDARD;

  if (user.role) {
    const role = user.role.toLowerCase() as ClientRole;
    if (Object.values(CLIENT_ROLES).includes(role)) {
      return role;
    }
  }

  if (user.email) {
    if (user.email.includes("premium") || user.full_name?.includes("Premium")) {
      return CLIENT_ROLES.PREMIUM;
    } else if (user.email.includes("enterprise") || user.full_name?.includes("Enterprise")) {
      return CLIENT_ROLES.ENTERPRISE;
    }
  }

  return CLIENT_ROLES.STANDARD;
};

// ========================
// Features per client role
// ========================
interface BaseFeatures {
  canCreateRequests: boolean;
  canViewOwnRequests: boolean;
  canCancelRequests: boolean;
  maxActiveRequests: number;
  canViewDesigns: boolean;
  canProvideDesignFeedback: boolean;
}

interface RoleFeatures {
  maxActiveRequests: number;
  prioritySupport?: boolean;
  expressDelivery?: boolean;
  canCreateTeam?: boolean;
  canAccessTemplates?: boolean;
  canRequestRevisions?: number;
  canScheduleConsultation?: boolean;
  dedicatedDesigner?: boolean;
  brandingConsistency?: boolean;
  bulkOrdering?: boolean;
}

export const getClientFeatures = (role: ClientRole): BaseFeatures & RoleFeatures => {
  const features = {
    base: {
      canCreateRequests: true,
      canViewOwnRequests: true,
      canCancelRequests: true,
      maxActiveRequests: 1,
      canViewDesigns: true,
      canProvideDesignFeedback: true,
    },
    [CLIENT_ROLES.STANDARD]: {
      maxActiveRequests: 3,
      prioritySupport: false,
      expressDelivery: false,
      canCreateTeam: false,
      canAccessTemplates: false,
      canRequestRevisions: 1,
      canScheduleConsultation: false,
    },
    [CLIENT_ROLES.PREMIUM]: {
      maxActiveRequests: 10,
      prioritySupport: true,
      expressDelivery: false,
      canCreateTeam: true,
      canAccessTemplates: true,
      canRequestRevisions: 3,
      canScheduleConsultation: true,
    },
    [CLIENT_ROLES.ENTERPRISE]: {
      maxActiveRequests: 25,
      prioritySupport: true,
      expressDelivery: true,
      canCreateTeam: true,
      canAccessTemplates: true,
      canRequestRevisions: 5,
      canScheduleConsultation: true,
      dedicatedDesigner: true,
      brandingConsistency: true,
      bulkOrdering: true,
    },
  };

  return {
    ...features.base,
    ...(features[role] || features[CLIENT_ROLES.STANDARD]),
  };
};

// ========================
// Nav Items per client role
// ========================
export interface NavItem {
  name: string;
  path: string;
  icon: string;
}

export const getClientNavItems = (role: ClientRole): NavItem[] => {
  const baseNavItems: NavItem[] = [
    { name: "Dashboard", path: "/client", icon: "dashboard" },
    { name: "My Requests", path: "/client/requests", icon: "requests" },
    { name: "My Designs", path: "/client/designs", icon: "designs" },
  ];

  if (role === CLIENT_ROLES.PREMIUM || role === CLIENT_ROLES.ENTERPRISE) {
    baseNavItems.push({ name: "Templates", path: "/client/templates", icon: "templates" });
  }

  if (role === CLIENT_ROLES.ENTERPRISE) {
    baseNavItems.push(
      { name: "Team Management", path: "/client/team", icon: "team" },
      { name: "Brand Assets", path: "/client/brand", icon: "brand" }
    );
  }

  return baseNavItems;
};

// ========================
// Role Display Name
// ========================
export const getRoleDisplayName = (role: ClientRole): string => {
  switch (role) {
    case CLIENT_ROLES.PREMIUM:
      return "Premium Client";
    case CLIENT_ROLES.ENTERPRISE:
      return "Enterprise Client";
    case CLIENT_ROLES.STANDARD:
    default:
      return "Standard Client";
  }
};

// ========================
// Role Badge Color
// ========================
export const getRoleBadgeColor = (role: ClientRole): string => {
  switch (role) {
    case CLIENT_ROLES.PREMIUM:
      return "bg-purple-600 text-white";
    case CLIENT_ROLES.ENTERPRISE:
      return "bg-indigo-600 text-white";
    case CLIENT_ROLES.STANDARD:
    default:
      return "bg-blue-600 text-white";
  }
};

// ========================
// Role Actions
// ========================
export interface RoleAction {
  name: string;
  path: string;
  icon: string;
}

export const getRoleActions = (role: ClientRole): RoleAction[] => {
  const actions: RoleAction[] = [
    { name: "New Design Request", path: "/client/requests/new", icon: "new-request" },
  ];

  if (role === CLIENT_ROLES.PREMIUM || role === CLIENT_ROLES.ENTERPRISE) {
    actions.push({ name: "Schedule Consultation", path: "/client/consultation", icon: "consultation" });
  }

  if (role === CLIENT_ROLES.ENTERPRISE) {
    actions.push(
      { name: "Bulk Order", path: "/client/bulk-order", icon: "bulk-order" },
      { name: "Contact Dedicated Designer", path: "/client/contact-designer", icon: "contact" }
    );
  }

  return actions;
};
