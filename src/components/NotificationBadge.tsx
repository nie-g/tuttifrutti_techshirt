import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationBadgeProps {
  count?: number;
  maxCount?: number;
  showZero?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  color?:
    | "red"
    | "blue"
    | "green"
    | "yellow"
    | "purple"
    | "teal"
    | "orange";
  className?: string;
}

/**
 * Notification Badge Component
 * Shows a red badge with unread notification count
 */
const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count = 0,
  maxCount = 99,
  showZero = false,
  size = "sm",
  color = "red",
  className = "",
}) => {
  // Don't show badge if count is 0 and showZero is false
  if (count === 0 && !showZero) {
    return null;
  }

  // Format count display (e.g., 99+ for counts over maxCount)
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  // Size variants
  const sizeClasses: Record<NonNullable<NotificationBadgeProps["size"]>, string> = {
    xs: "h-3 w-3 text-[8px] min-w-[12px]",
    sm: "h-4 w-4 text-[10px] min-w-[16px]",
    md: "h-5 w-5 text-sm min-w-[20px]",
    lg: "h-6 w-6 text-base min-w-[24px]",
  };

  // Color variants
  const colorClasses: Record<NonNullable<NotificationBadgeProps["color"]>, string> = {
    red: "bg-red-500 text-white",
    blue: "bg-blue-500 text-white",
    green: "bg-green-500 text-white",
    yellow: "bg-yellow-500 text-white",
    purple: "bg-purple-500 text-white",
    teal: "bg-teal-500 text-white",
    orange: "bg-orange-500 text-white",
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 40,
          duration: 0.8,
        }}
        className={`
          absolute -top-1 -right-1
          ${sizeClasses[size]}
          ${colorClasses[color]}
          rounded-full
          flex items-center justify-center
          font-bold
          shadow-lg
          border-2 border-white
          z-10
          ${className}
        `}
      >
        {displayCount}
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationBadge;
