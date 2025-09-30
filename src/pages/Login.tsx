import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; 
import cutie from "../images/tuttifruitties.png";
import { useSignIn } from "@clerk/clerk-react";

const Login = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Email + password login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!isLoaded || !signIn) return;

    try {
      const result = await signIn.create({
        identifier: form.email,
        password: form.password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate("/dashboard");
      } else {
        console.error("Sign in not complete:", result);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.errors ? err.errors[0].message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // OAuth login
  const handleOAuth = async (provider: "oauth_google") => {
    if (!isLoaded || !signIn) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err: any) {
      console.error("OAuth login error:", err);
      setError(err.errors ? err.errors[0].message : "Google login failed");
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
      {/* Navbar */}
      <Navbar />

      {/* Two-column layout */}
      <div className="flex flex-1">
        {/* Left side */}
        <div className="w-1/2 hidden lg:flex flex-col items-center justify-center bg-gradient-to-r relative">
          <h1 className="text-4xl font-bold mb-4 text-start">Welcome Back</h1>
          <p className="text-lg text-start max-w-md">
            Log in to <span className="font-semibold">TechShirt</span> and manage 
            your shirt designs, connect with designers, and continue bringing 
            your creative ideas to life.
          </p>
          <img src={cutie} alt="DesignSync" className="w-[30vw] mb-2" />
        </div>

        {/* Right side (form) */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
            <h1 className="text-2xl font-bold mb-1 text-gray-600">Login</h1>
            <h2 className="text-l font-semibold text-gray-800 mb-4">Access your account</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  aria-label="Email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-400"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  aria-label="Password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-400"
                  required
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-teal-500 text-white rounded-md font-medium hover:bg-teal-600 transition"
              >
                {loading ? "Logging in..." : "Login"}
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
              Don’t have an account?{" "}
              <a href="/register" className="text-teal-600 font-medium">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Login;
