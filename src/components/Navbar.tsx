import { Link } from "react-router-dom";
import { SignedOut, SignedIn, useClerk, UserButton } from "@clerk/clerk-react";

const Navbar = () => {
  const clerk = useClerk();

  const handleLogout = async () => {
    await clerk.signOut();
  };

  return (
    <nav className="flex justify-between items-center p-5 bg-white shadow-md">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-black">
          <span className="text-teal-500">Tech</span>Shirt
        </span>
      </div>

      {/* Navigation Links */}
      <div className="hidden md:flex gap-8 text-gray-900 font-medium">
        {["Home", "Features", "Pricing", "About"].map((item, index) => (
          <Link
            key={index}
            to={`/${item.toLowerCase()}`}
            className="hover:text-teal-500 transition-all"
          >
            {item}
          </Link>
        ))}
      </div>

      {/* Auth Buttons */}
      <div className="flex gap-4 items-center">
        <SignedOut>
          <>
            <Link
              to="/sign-in"
              className="px-5 py-2 border-2 border-teal-500 text-teal-500 rounded-full font-medium hover:bg-teal-500 hover:text-white transition-all"
            >
              Log In
            </Link>
            <Link
              to="/sign-up"
              className="px-5 py-2 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600 transition-all"
            >
              Sign Up
            </Link>
          </>
        </SignedOut>

        <SignedIn>
          <div className="flex items-center gap-3">
            <UserButton />
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </SignedIn>
      </div>
    </nav>
  );
};

export default Navbar;
