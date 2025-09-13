import { SignUp } from "@clerk/clerk-react";

export default function SignUpPage() {
  return (
    <div className="flex justify-center items-center h-screen">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        forceRedirectUrl={"/dashboard"}
        unsafeMetadata={{ userType: "client" }} // ✅ gets stored in Convex via webhook
      />
    </div>
  );
}
