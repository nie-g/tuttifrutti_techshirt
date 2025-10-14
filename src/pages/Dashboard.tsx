import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded) return; // wait until Clerk loads

    if (!isSignedIn) {
      navigate("/", { replace: true });
      return;
    }

    const userType = typeof user?.unsafeMetadata?.userType === "string"
      ? user.unsafeMetadata.userType
      : null;

    switch (userType) {
      case "admin":
        navigate("/admin", { replace: true });
        break;
      case "designer":
        navigate("/designer", { replace: true });
        break;
      case "client":
        navigate("/client", { replace: true });
        break;
      default:
        navigate("/", { replace: true });
    }
  }, [isLoaded, isSignedIn, user, navigate]);

  return <div>Loading...</div>; // optional: show a spinner
}
