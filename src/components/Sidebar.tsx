import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useClerk, useUser } from "@clerk/clerk-react";
import {
  Home,
  Clock,
  Settings,
  LogOut,
  Palette,
  Images,
  Bell as BellIcon,
  Users,
  FileText,
  BarChart,
  Layers,
  Box,
  BookText,
  Menu,
  X,
} from "lucide-react";
import logoIcon from "../images/cutiepie.png";
import { useUnreadNotificationCount } from "../hooks/UnreadNotificationsCount";
import NotificationBadge from "./NotificationBadge";

type UserType = "admin" | "designer" | "client";

interface NavItem {
  name: string;
  icon: React.ReactNode;
  route: string;
}

const Sidebar: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { signOut } = useClerk();
  const { user } = useUser();
  const navigate = useNavigate();
  const { unreadCount } = useUnreadNotificationCount();

  const userType: UserType =
    (user?.unsafeMetadata?.userType as UserType) || "client";

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", (error as Error).message);
    }
  };

  const getThemeColor = () => {
    switch (userType) {
      case "admin":
        return { text: "text-purple-400", hover: "hover:bg-purple-500" };
      case "designer":
        return { text: "text-teal-400", hover: "hover:bg-teal-500" };
      default:
        return { text: "text-blue-400", hover: "hover:bg-blue-500" };
    }
  };

  const { text, hover } = getThemeColor();

  const getNavItems = (): NavItem[] => {
    switch (userType) {
      case "admin":
        return [
          { name: "Dashboard", icon: <Home />, route: "/admin" },
          { name: "Users", icon: <Users />, route: "/admin/users" },
          { name: "Requests", icon: <FileText />, route: "/admin/requests" },
          { name: "Designs", icon: <Palette />, route: "/admin/designs" },
          { name: "Templates & Pricing", icon: <Layers />, route: "/admin/templates" },
          { name: "Inventory", icon: <Box />, route: "/admin/inventory" },
          { name: "Notifications", icon: <BellIcon />, route: "/notifications" },
          { name: "Reports", icon: <BarChart />, route: "/admin/reports" },
        ];
      case "designer":
        return [
          { name: "Dashboard", icon: <Home />, route: "/designer" },
          { name: "Gallery", icon: <Images />, route: "/designer/gallery" },
          { name: "My Designs", icon: <Palette />, route: "/designer/designs" },
          { name: "Notifications", icon: <BellIcon />, route: "/notifications" },
          { name: "Settings", icon: <Settings />, route: "/designer/settings" },
        ];
      default:
        return [
          { name: "Dashboard", icon: <Home />, route: "/client" },
          { name: "My Requests", icon: <Clock />, route: "/client/requests" },
          { name: "My Orders", icon: <BookText />, route: "/client/designs" },
          { name: "Browse Galleries", icon: <Layers />, route: "/client/browse" },
          { name: "Notifications", icon: <BellIcon />, route: "/notifications" },
          { name: "Settings", icon: <Settings />, route: "/client/settings" },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* 🔹 Hamburger button — visible only on mobile */}
      {!isMobileOpen && (
        <button
          className="md:hidden fixed top-4 left-4 z-50 text-[#0A192F] p-2"
          onClick={() => setIsMobileOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>
      )}

      {/* 🔹 Mobile Sidebar Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          {/* overlay */}
          <button
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close sidebar backdrop"
          />
          {/* drawer */}
          <aside className="relative w-64 h-full bg-[#0A192F] text-white flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <img src={logoIcon} alt="logo" className="w-10 h-10" />
                <h1 className={text}>
                  Tech<span className="text-white">Shirt</span>
                </h1>
              </div>
              <button
                className="p-2"
                onClick={() => setIsMobileOpen(false)}
                aria-label="Close sidebar"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto mt-2 px-2 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.route}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-lg space-x-3 transition-all relative ${hover}`}
                >
                  <span className={`${text} relative`}>
                    {item.icon}
                    {item.name === "Notifications" && unreadCount > 0 && (
                      <NotificationBadge
                        count={unreadCount}
                        size="sm"
                        color="red"
                        className="animate-pulse"
                      />
                    )}
                  </span>
                  <span className="flex items-center">
                    {item.name}
                    {item.name === "Notifications" && unreadCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </span>
                </Link>
              ))}
            </nav>

            <div className="px-4 py-5 flex-shrink-0">
              <button
                onClick={() => {
                  setIsMobileOpen(false);
                  handleLogout();
                }}
                className="flex items-center space-x-3 text-red-300 hover:text-red-500"
              >
                <LogOut />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 🔹 Desktop Sidebar — visible only on md+ */}
      <aside className="hidden md:flex md:w-64 sticky top-0 h-screen bg-[#0A192F] text-white flex-col">
        <div className="flex items-center p-5 space-x-3 text-xl font-bold flex-shrink-0">
          <img src={logoIcon} alt="App Logo" className="w-10 h-10" />
          <h1 className={text}>
            Tech<span className="text-white">Shirt</span>
          </h1>
        </div>

        <nav className="flex-1 overflow-y-auto mt-2 px-2 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.route}
              className={`flex items-center px-4 py-3 rounded-lg space-x-3 transition-all relative ${hover}`}
            >
              <span className={`${text} relative`}>
                {item.icon}
                {item.name === "Notifications" && unreadCount > 0 && (
                  <NotificationBadge
                    count={unreadCount}
                    size="sm"
                    color="red"
                    className="animate-pulse"
                  />
                )}
              </span>
              <span className="flex items-center">
                {item.name}
                {item.name === "Notifications" && unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
            </Link>
          ))}
        </nav>

        <div className="px-4 py-5 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 text-red-300 hover:text-red-500"
          >
            <LogOut />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
