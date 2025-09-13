import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthRedirect() {
  const { user, isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const emailStatus = user?.primaryEmailAddress?.verification?.status;

    if (emailStatus === "verified") {
      navigate("/dashboard"); // ✅ verified users go to dashboard
    } else {
      navigate("/verify-email"); // 🚧 unverified users go here
    }
  }, [isLoaded, isSignedIn, user, navigate]);

  return null; // no UI, just redirects
}
