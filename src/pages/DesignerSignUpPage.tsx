import { SignUp } from "@clerk/clerk-react";

export default function DesignerSignUpPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Designer Sign Up
        </h1>
         <SignUp
              path="/signup/designer"
              signInUrl="/sign-in"
              forceRedirectUrl={"/dashboard"}
              unsafeMetadata={{ userType: "designer" }}
         />
      </div>
    </div>
  );
}
