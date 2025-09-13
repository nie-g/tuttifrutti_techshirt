import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      navigate("/", { replace: true });
      return;
    }

    // Get userType from unsafeMetadata
    const userType =
      typeof user?.unsafeMetadata?.userType === "string"
        ? user.unsafeMetadata.userType
        : null;

    // Redirect to the correct dashboard
    if (userType === "admin") navigate("/admin", { replace: true });
    else if (userType === "designer") navigate("/designer", { replace: true });
    else if (userType === "client") navigate("/client", { replace: true });
    else navigate("/", { replace: true }); // fallback if no type
  }, [isLoaded, isSignedIn, user, navigate]);

  return null; // no UI, just redirects
}
