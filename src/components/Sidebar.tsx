import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useClerk, useUser } from "@clerk/clerk-react";
import {
  Home, Clock, Settings, LogOut, Palette, Images, Bell as BellIcon, Users, FileText, BarChart, Layers, Box, NotebookPenIcon
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
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);
  const { signOut } = useClerk();
  const { user } = useUser();
  const navigate = useNavigate();

  const { unreadCount } = useUnreadNotificationCount();

  // ✅ Get userType from Clerk metadata (fallback client)
  const userType: UserType =
    (user?.unsafeMetadata?.userType as UserType) || "client";

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", (error as Error).message);
    }
  };

  // ✅ Theme colors with safe Tailwind classes
  const getThemeColor = () => {
    switch (userType) {
      case "admin":
        return { text: "text-purple-400", hover: "hover:bg-purple-500" };
      case "designer":
        return { text: "text-teal-400", hover: "hover:bg-teal-500" };
      case "client":
      default:
        return { text: "text-blue-400", hover: "hover:bg-blue-500" };
    }
  };

  const { text, hover } = getThemeColor();

  // ✅ Navigation by role
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
          { name: "Projects", icon: <NotebookPenIcon />, route: "/designer/tasks" },
          { name: "Gallery", icon: <Images />, route: "/designer/gallery" },
          { name: "Designs", icon: <Palette />, route: "/designer/designs" },
          { name: "Notifications", icon: <BellIcon />, route: "/notifications" },
          { name: "Settings", icon: <Settings />, route: "/designer/settings" },
        ];
      case "client":
      default:
        return [
          { name: "Dashboard", icon: <Home />, route: "/client" },
          { name: "My Requests", icon: <Clock />, route: "/client/requests" },
          { name: "My Designs", icon: <Images />, route: "/client/designs" },
          { name: "Browse Galleries", icon: <Layers />, route: "/client/browse" },
          { name: "Notifications", icon: <BellIcon />, route: "/notifications" },
          { name: "Settings", icon: <Settings />, route: "/client/settings" },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside
  className={`bg-[#0A192F] text-white transition-all duration-300 ease-in-out ${
    isSmallScreen ? "w-20" : "w-64"
  } sticky top-0 h-screen flex flex-col`}
>
  {/* Logo */}
  <div className="flex items-center p-5 space-x-3 text-xl font-bold flex-shrink-0">
    <img src={logoIcon} alt="App Logo" className="w-10 h-10" />
    {!isSmallScreen && (
      <h1 className={text}>
        Tech<span className="text-white">Shirt</span>
      </h1>
    )}
  </div>

  {/* Scrollable Nav */}
  <nav className="flex-1 overflow-y-hidden mt-2 px-2 space-y-2">
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
        {!isSmallScreen && (
          <span className="flex items-center">
            {item.name}
            {item.name === "Notifications" && unreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </span>
        )}
      </Link>
    ))}
  </nav>

  {/* Logout (footer) */}
  <div className="px-4 py-5 flex-shrink-0">
    <button
      onClick={handleLogout}
      className="flex items-center space-x-3 text-red-300 hover:text-red-500"
    >
      <LogOut />
      {!isSmallScreen && <span>Sign Out</span>}
    </button>
  </div>
</aside>

  );
};

export default Sidebar;
