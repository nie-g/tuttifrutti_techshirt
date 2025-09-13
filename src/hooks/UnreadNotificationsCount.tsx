import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export const useUnreadNotificationCount = () => {
  const { user } = useUser();

  // Step 1: fetch Convex user by Clerk ID
  const convexUser = useQuery(
    api.userQueries.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  // Step 2: fetch notifications only when convexUser exists
  const notifications = useQuery(
    api.notifications.getUserNotifications,
    convexUser ? { userId: convexUser._id as Id<"users"> } : "skip"
  ) || [];

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    unreadCount,
    totalCount: notifications.length,
    hasNotifications: notifications.length > 0,
    hasUnreadNotifications: unreadCount > 0,
  };
};
