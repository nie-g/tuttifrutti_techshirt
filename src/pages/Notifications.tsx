import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminNavbar from "../components/UsersNavbar";
import DynamicSidebar from "../components/Sidebar";
import { useUser } from "@clerk/clerk-react";
import { Bell, CheckCircle, Clock, AlertTriangle, Trash2 } from "lucide-react";
import { formatTimeAgo } from "./utils/convexUtils";

interface Notification {
  id: string; // _id from Convex
  notif_content: string;
  is_read?: boolean;
  created_at?: number;
}

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { user: clerkUser } = useUser();
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "designer" | "client" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current user from Convex users table by Clerk ID
  const userRecord = useQuery(api.userQueries.getUserByClerkId, clerkUser ? { clerkId: clerkUser.id } : "skip");

  useEffect(() => {
    if (!clerkUser) {
      navigate("/sign-in");
      return;
    }

    if (userRecord) {
      setUserId(userRecord._id);
      setUserRole(userRecord.role);
      setIsLoading(false);
    } else if (userRecord === undefined) {
      return; // still loading
    } else {
      setError("Could not retrieve your user data. Please log in again.");
      localStorage.removeItem("user");
      navigate("/sign-in");
    }
  }, [clerkUser, userRecord, navigate]);

  // Fetch notifications for the current user
  const notificationsRaw = useQuery(
    api.notifications.getUserNotifications,
    userId ? { userId: userId as any } : "skip" // cast string → Id<"users">
  ) || [];

  // Map Convex fields to local Notification interface
  const notifications: Notification[] = notificationsRaw.map((n: any) => ({
    id: n._id,
    notif_content: n.content,
    is_read: n.isRead,
    created_at: n.createdAt,
  }));

  // Mutations
  const markAsReadMutation = useMutation(api.notifications.markNotificationAsRead);
  const markAllAsReadMutation = useMutation(api.notifications.markAllNotificationsAsRead);
  const deleteNotificationMutation = useMutation(api.notifications.deleteNotification);

  const markAsRead = async (id: string) => {
    try {
      await markAsReadMutation({ notificationId: id as any }); // cast string → Id<"notifications">
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteNotificationMutation({ notificationId: id as any }); // cast string → Id<"notifications">
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      await markAllAsReadMutation({ userId: userId as any }); // cast string → Id<"users">
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="flex min-h-screen bg-gradient-to-br from-white to-teal-50">
        <DynamicSidebar />
        <div className="flex-1 flex flex-col">
          <AdminNavbar />
          <main className="p-6 md:p-8 flex flex-col items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-md w-full">
              <div className="p-4 bg-teal-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Loading Notifications</h2>
              <p className="text-gray-600">Please wait while we retrieve your notifications...</p>
            </div>
          </main>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="flex min-h-screen bg-gradient-to-br from-white to-teal-50">
        <DynamicSidebar />
        <div className="flex-1 flex flex-col">
          <AdminNavbar />
          <main className="p-6 md:p-8 flex flex-col items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-md w-full">
              <div className="p-4 bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={36} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button onClick={() => navigate("/sign-in")} className="px-6 py-2.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors font-medium">
                Go to Login
              </button>
            </div>
          </main>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="flex min-h-screen bg-gradient-to-br from-white to-teal-50">
      <DynamicSidebar />
      <div className="flex-1 flex flex-col">
        <AdminNavbar />
        <main className="p-4 sm:p-6 md:p-8 flex flex-col gap-4 sm:gap-6 overflow-auto">
          {/* Header */}
          <div className="p-4 sm:p-6 bg-white rounded-xl sm:rounded-2xl shadow-md">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Stay updated with your latest activities</p>
          </div>

          {/* Stats Card */}
          <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-md border-l-4 border-teal-500 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Notifications</p>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{notifications.length}</h3>
              </div>
              <div className="p-2 sm:p-3 bg-teal-100 rounded-full">
                <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-teal-500" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex gap-2 sm:gap-3 flex-wrap">
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">Unread: {notifications.filter(n => !n.is_read).length}</span>
              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Read: {notifications.filter(n => n.is_read).length}</span>
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
              <div className="flex items-center">
                <Bell className="text-teal-500 mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                <h2 className="text-base sm:text-lg font-semibold">Your Notifications</h2>
              </div>
              {notifications.some((n) => !n.is_read) && (
                <button onClick={markAllAsRead} className="text-xs sm:text-sm bg-teal-100 text-teal-700 px-3 py-1.5 rounded-lg hover:bg-teal-200 transition-colors self-start sm:self-auto">
                  Mark all as read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-6 sm:py-8 bg-teal-50 rounded-xl">
                <div className="p-3 bg-teal-100 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-teal-500" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900">No notifications</h3>
                <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto px-4">You don't have any notifications at the moment. Notifications will appear here when there are updates to your account or activities.</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.id} className={`p-3 sm:p-4 border rounded-lg sm:rounded-xl transition-all hover:shadow-md ${notification.is_read ? "bg-white" : "bg-teal-50 border-teal-200"}`}>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-2">
                          <div className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${notification.is_read ? 'bg-gray-300' : 'bg-teal-500'}`}></div>
                          <span className="text-xs text-gray-500">{notification.is_read ? 'Read' : 'New'}</span>
                        </div>
                        <p className="text-sm sm:text-base text-gray-700 break-words">{notification.notif_content}</p>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span>{notification.created_at ? formatTimeAgo(notification.created_at) : ''}</span>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2 sm:ml-4 self-start">
                        {!notification.is_read && (
                          <button onClick={() => markAsRead(notification.id)} className="text-teal-600 hover:text-teal-800 p-1.5 rounded-full hover:bg-teal-100 transition-colors" title="Mark as read">
                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        )}
                        <button onClick={() => deleteNotification(notification.id)} className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-100 transition-colors" title="Delete notification">
                          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </motion.div>
  );
};

export default Notifications;
