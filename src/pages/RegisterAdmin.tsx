import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; 
import cutie from "../images/tuttifruitties.png";
import { useSignUp } from "@clerk/clerk-react";

const Register = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔑 persist signup attempt ID across renders
  const signUpIdRef = useRef<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Step 1: Sign up
  // Step 1: Sign up
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  if (!isLoaded || !signUp) return;

  try {
    await signUp.create({
      emailAddress: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      unsafeMetadata: {
        userType: "admin",
      },
    });

    // request email code
    await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

    setVerifying(true); // switch UI to verification step
  } catch (err: any) {
    console.error("Signup error details:", err);
    setError(err.errors?.[0]?.message || "Sign up failed");
  } finally {
    setLoading(false);
  }
};

// Step 2: Verify email
const handleVerification = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  if (!isLoaded || !signUp) return;

  try {
    const complete = await signUp.attemptEmailAddressVerification({ code });

    if (complete.status === "complete") {
      await setActive({ session: complete.createdSessionId });
      navigate("/dashboard");
    } else {
      setError("Verification not complete. Please try again.");
    }
  } catch (err: any) {
    console.error("Verification error details:", err);
    setError(err.errors?.[0]?.message || "Verification failed");
  } finally {
    setLoading(false);
  }
};

  // Google OAuth
  const handleOAuth = async (provider: "oauth_google") => {
    if (!isLoaded || !signUp) return;
    try {
      await signUp.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
        unsafeMetadata: { userType: "admin" },
      });
    } catch (err: any) {
      console.error("OAuth signup error:", err);
      if (err.errors && err.errors.length > 0) {
        setError(err.errors[0].message);
      } else {
        setError("Google signup failed");
      }
    }
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="font-sans bg-gradient-to-r from-white to-teal-50 min-h-screen flex flex-col"
    >
      <Navbar />

      <div className="flex flex-1">
        {/* Left */}
        <div className="w-1/2 hidden lg:flex flex-col items-center justify-center bg-gradient-to-r relative">
          <h1 className="text-4xl font-bold mb-4 text-start">Why choose TechShirt</h1>
          <p className="text-lg text-start max-w-md">
            Join <span className="font-semibold">TechShirt</span> and start creating
            your personalized shirt designs with ease. Connect with designers, 
            explore creative templates, and bring your ideas to life.
          </p>
          <img src={cutie} alt="DesignSync" className="w-[30vw] mb-2" />
        </div>

        {/* Right (form) */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
            <h1 className="text-2xl font-bold mb-1 text-gray-600">Signup as an Admin</h1>
            <h2 className="text-l font-semibold text-gray-800 mb-4">
              Join the community today!
            </h2>

            {!verifying ? (
              <>
                {/* Signup form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input
                        aria-label="First name"
                        type="text"
                        placeholder="First Name"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-400"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        placeholder="Last Name"
                        aria-label="Last name"
                        type="text"
                        name="lastName"
                        value={form.lastName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-400"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <input
                      aria-label="Email"
                      type="email"
                      placeholder="Email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-400"
                      required
                    />
                  </div>

                  <div>
                    <input
                      aria-label="Password"
                      placeholder="Password"
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-400"
                      required
                    />
                  </div>
                  <div id="clerk-captcha" />

                  {error && <p className="text-red-500 text-sm">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-teal-500 text-white rounded-md font-medium hover:bg-teal-600 transition"
                  >
                    {loading ? "Signing up..." : "Signup"}
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center my-4">
                  <div className="flex-grow border-t border-gray-300"></div>
                  <span className="px-2 text-gray-400 text-sm">OR</span>
                  <div className="flex-grow border-t border-gray-300"></div>
                </div>

                {/* Google OAuth */}
                <button
                  onClick={() => handleOAuth("oauth_google")}
                  className="w-full py-2 border border-gray-400 flex items-center justify-center gap-2 rounded-md hover:bg-gray-100"
                >
                  <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="Google"
                    className="w-5 h-5"
                  />
                  Continue with Google
                </button>

                <p className="text-sm text-gray-500 mt-4 text-center">
                  Already have an account?{" "}
                  <a href="/login" className="text-teal-600 font-medium">
                    Login
                  </a>
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Verify Your Email
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  We sent a verification code to {form.email}
                </p>

                <form onSubmit={handleVerification} className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600">Verification Code</label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-400"
                      placeholder="Enter verification code"
                    />
                  </div>

                  {error && <p className="text-red-500 text-sm">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-teal-500 text-white rounded-md font-medium hover:bg-teal-600 transition"
                  >
                    {loading ? "Verifying..." : "Verify Email"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Register;
